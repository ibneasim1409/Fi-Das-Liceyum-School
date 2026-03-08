const cron = require('node-cron');
const Challan = require('./models/Challan');
const Admission = require('./models/Admission');
const FeeStructure = require('./models/FeeStructure');
const SchoolSettings = require('./models/SchoolSettings');
const { sendMessage } = require('./services/whatsappService');
const { sendSMS } = require('./services/smsService');

// ---------------------------------------------------------
// JOB 1: 1st of the Month Automated Generation (Midnight)
// ---------------------------------------------------------
const initMonthlyGenerationCron = () => {
    // Run at 00:01 AM on the 1st of every month
    cron.schedule('1 0 1 * *', async () => {
        console.log(`[CRON] Intercepting Monthly Challan Generation: ${new Date().toISOString()}`);

        try {
            const today = new Date();
            const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(today);

            // Load Enterprise Billing Configs once before looping to save operations
            const settings = await SchoolSettings.getSettings();
            const earlyBirdPercent = settings.billing?.earlyBirdDiscountPercentage || 10;
            const validDays = settings.billing?.earlyBirdValidityDays || 10;

            // Generate the dynamic cutoff point
            const dueDate = new Date();
            dueDate.setDate(validDays);
            dueDate.setHours(23, 59, 59, 999);

            // Get all permanently admitted students
            const students = await Admission.find({ status: 'admitted' }).populate('classId');

            let generatedCount = 0;

            for (const student of students) {
                // Safeguard: Do not generate if a valid challan already exists for this month
                const existing = await Challan.findOne({
                    studentId: student.studentId,
                    month: monthLabel,
                    status: { $ne: 'void' }
                });

                if (existing) continue;

                // Enterprise Early Bird Logic: 10% off for "Default Plan"
                let earlyBirdDiscount = 0;
                let hasEarlyBird = false;

                if (student.feeSnapshot?.structureName?.startsWith('Default Plan')) {
                    // Early Bird Discount dynamically grabbed from global scale
                    const siblingDeduction = (student.feeSnapshot?.tuitionFee || 0) * ((student.siblingDiscountPercentage || 0) / 100);
                    const netTuition = Math.max(0, (student.feeSnapshot?.tuitionFee || 0) - siblingDeduction);
                    earlyBirdDiscount = netTuition * (earlyBirdPercent / 100);
                    hasEarlyBird = true;
                }

                // Generate Sequential Challan Number
                const challanCount = await Challan.countDocuments();
                const challanNumber = `CHL-M-${today.getFullYear()}-${(challanCount + 1).toString().padStart(5, '0')}`;

                const challan = new Challan({
                    challanNumber,
                    admissionId: student._id,
                    studentId: student.studentId,
                    studentName: student.studentName,
                    classId: student.classId?._id || student.classId,
                    type: 'monthly',
                    month: monthLabel,
                    dueDate: dueDate,
                    fees: {
                        tuitionFee: student.feeSnapshot?.tuitionFee || 0,
                        discount: ((student.feeSnapshot?.tuitionFee || 0) * ((student.siblingDiscountPercentage || 0) / 100)) + earlyBirdDiscount, // Combine sibling amt + early bird amt
                        otherFees: []
                    },
                    // We store a flag so the expiration cron knows it has an early bird applied
                    metadata: hasEarlyBird ? { appliedEarlyBird: true, earlyBirdAmount: earlyBirdDiscount } : {}
                });

                await challan.save();
                generatedCount++;

                // Fire and Forget Communications
                if (student.phoneNumber) {
                    const message = `📢 Monthly Fee Alert - Fi-Das Liceyum School\n\nDear Parent, the fee challan for *${student.studentName}* for the month of *${monthLabel}* has been generated.\n\n*Challan No:* ${challanNumber}\n*Total Fee:* Rs. ${challan.totalAmount.toLocaleString()}\n*Due Date:* ${new Date(challan.dueDate).toLocaleDateString()}\n\n${hasEarlyBird ? `🎁 *Early Bird Discount Applied!* Save Rs. ${earlyBirdAmount.toLocaleString()} by paying before the due date.` : 'Please pay before the due date to avoid late penalties.'}\n\nYour PDF challan is available via the portal.`;

                    sendMessage(student.phoneNumber, message).catch(err => {
                        console.log(`[Cron Communicator] WhatsApp dispatch failed for ${student.studentName} (${err.message})`);
                    });

                    sendSMS(student.phoneNumber, message).catch(err => {
                        console.log(`[Cron Communicator] SMS dispatch failed for ${student.studentName} (${err.message})`);
                    });
                }
            }
            console.log(`[CRON - Success] Generated ${generatedCount} automated monthly challans for ${monthLabel}.`);
        } catch (err) {
            console.error('[CRON - Error] Failed Monthly Generation:', err);
        }
    }, {
        timezone: "Asia/Karachi"
    });
};

// ---------------------------------------------------------
// JOB 2: Daily Midnight Penalty / Auto-Voiding 
// ---------------------------------------------------------
const initExpiryCheckerCron = () => {
    // Run at 00:05 AM every day
    cron.schedule('5 0 * * *', async () => {
        console.log(`[CRON] Running daily expiry check: ${new Date().toISOString()}`);
        try {
            const now = new Date();

            // Find ALL pending current-month or older challans strictly past due date by 1 millisecond
            // that ALSO have the early bird discount applied.
            const expiredEarlyBirdChallans = await Challan.find({
                status: 'pending',
                dueDate: { $lt: now },
                'metadata.appliedEarlyBird': true
            }).populate('admissionId');

            let voidedCount = 0;

            for (const oldChallan of expiredEarlyBirdChallans) {
                // 1. Instantly Void the discounted challan
                oldChallan.status = 'void';
                oldChallan.metadata = { ...oldChallan.metadata, voidReason: 'Early bird expired' };
                await oldChallan.save();

                const student = oldChallan.admissionId;
                if (!student) continue;

                // 2. Generate a fresh, standard Base Bill (without the 10% discount)
                const challanCount = await Challan.countDocuments();
                const challanNumber = `CHL-M-${now.getFullYear()}-${(challanCount + 1).toString().padStart(5, '0')}`;

                // Due date sets strictly to end of current month
                const newDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

                const baseChallan = new Challan({
                    challanNumber,
                    admissionId: student._id,
                    studentId: student.studentId,
                    studentName: student.studentName,
                    classId: student.classId,
                    type: 'monthly',
                    month: oldChallan.month, // Keep the same month text (e.g., April 2024)
                    dueDate: newDueDate,
                    fees: {
                        tuitionFee: student.feeSnapshot?.tuitionFee || 0,
                        discount: (student.feeSnapshot?.tuitionFee || 0) * ((student.siblingDiscountPercentage || 0) / 100), // ONLY the fixed sibling discount remains
                        otherFees: []
                    },
                    metadata: { autoRegenerated: true, previousVoidedChallan: oldChallan.challanNumber }
                });

                await baseChallan.save();
                voidedCount++;
            }

            if (voidedCount > 0) {
                console.log(`[CRON - Expiry] Automatically voided ${voidedCount} early-bird challans and generated base penalties.`);
            }
        } catch (err) {
            console.error('[CRON - Error] Expiry Checker failed:', err);
        }
    }, {
        timezone: "Asia/Karachi"
    });
};

// Initialize All Jobs
const initCronJobs = () => {
    console.log("-> Starting Enterprise node-cron Engine...");
    initMonthlyGenerationCron();
    initExpiryCheckerCron();
};

module.exports = { initCronJobs };

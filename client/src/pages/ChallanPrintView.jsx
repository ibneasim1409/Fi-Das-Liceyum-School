import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';

const ChallanPrintView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [challan, setChallan] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const from = queryParams.get('from');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchChallan = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/challans/${id}`);
                setChallan(res.data);
            } catch (err) {
                console.error('Error fetching challan:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchChallan();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        if (from === 'admissions') {
            navigate('/admissions');
        } else if (from === 'challans') {
            navigate('/challans');
        } else {
            navigate(-1);
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    if (!challan) return <div className="p-10 text-center">Challan not found</div>;

    const ChallanCopy = ({ title, hideBorder = false }) => (
        <div className={`w-[33.33%] p-3 ${!hideBorder ? 'border-r border-dashed border-gray-400' : ''} flex flex-col h-full bg-white text-[9px]`}>
            <div className="text-center mb-3 border-b border-gray-200 pb-2">
                <h2 className="text-sm font-black uppercase tracking-tighter">Fi Das Liceyum</h2>
                <p className={`font-bold ${title === 'Student Copy' ? 'text-secondary' : 'text-primary'}`}>{title}</p>
                <div className="mt-1 font-mono text-[8px] bg-gray-100 p-1 flex justify-between">
                    <span>No: {challan.challanNumber}</span>
                    <span>Due: {new Date(challan.dueDate).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="space-y-1.5 flex-1">
                <div className="flex justify-between border-b border-gray-100 py-0.5">
                    <span className="font-bold text-gray-500">Student:</span>
                    <span className="font-black">{challan.studentName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-0.5">
                    <span className="font-bold text-gray-500">Reg ID:</span>
                    <span className="font-black">{challan.studentId || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-0.5">
                    <span className="font-bold text-gray-500">Class:</span>
                    <span className="font-black font-mono">{challan.classId?.name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-0.5">
                    <span className="font-bold text-gray-500">Session:</span>
                    <span className="font-black font-mono">2024-25</span>
                </div>

                <div className="mt-3 border border-gray-300 rounded overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-300">
                            <tr>
                                <th className="px-2 py-0.5">Description</th>
                                <th className="px-2 py-0.5 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {challan.fees.tuitionFee > 0 && (
                                <tr>
                                    <td className="px-2 py-0.5">Tuition Fee ({challan.month})</td>
                                    <td className="px-2 py-0.5 text-right">Rs. {challan.fees.tuitionFee.toLocaleString()}</td>
                                </tr>
                            )}
                            {challan.fees.admissionFee > 0 && (
                                <tr>
                                    <td className="px-2 py-0.5">Admission Fee</td>
                                    <td className="px-2 py-0.5 text-right">Rs. {challan.fees.admissionFee.toLocaleString()}</td>
                                </tr>
                            )}
                            {challan.fees.annualExpenses > 0 && (
                                <tr>
                                    <td className="px-2 py-0.5">Annual Expenses</td>
                                    <td className="px-2 py-0.5 text-right">Rs. {challan.fees.annualExpenses.toLocaleString()}</td>
                                </tr>
                            )}
                            {challan.fees.securityDeposit > 0 && (
                                <tr>
                                    <td className="px-2 py-0.5">Security Deposit</td>
                                    <td className="px-2 py-0.5 text-right">Rs. {challan.fees.securityDeposit.toLocaleString()}</td>
                                </tr>
                            )}
                            {challan.fees.otherFees?.map((f, i) => (
                                <tr key={`other-${i}`}>
                                    <td className="px-2 py-0.5">{f.label}</td>
                                    <td className="px-2 py-0.5 text-right">Rs. {f.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold border-t border-gray-300">
                            {challan.fees.discount > 0 && (
                                <tr className="text-secondary text-[8px]">
                                    <td className="px-2 py-0.5 italic">Discount Applied</td>
                                    <td className="px-2 py-0.5 text-right">- Rs. {challan.fees.discount.toLocaleString()}</td>
                                </tr>
                            )}
                            <tr className="text-sm">
                                <th className="px-2 py-1">TOTAL PAYABLE</th>
                                <th className="px-2 py-1 text-right">Rs. {challan.totalAmount.toLocaleString()}</th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="mt-4 space-y-3">
                <div className="flex justify-between items-end gap-4 px-2">
                    <div className="flex-1 border-t border-gray-400 text-center pt-1 text-[8px]">Depositor Sig</div>
                    <div className="flex-1 border-t border-gray-400 text-center pt-1 text-[8px]">Authorized Seal</div>
                </div>
                <div className="text-[7px] text-gray-400 italic leading-tight border-t pt-1.5 uppercase">
                    * Valid for payment at any branch of Allied Bank
                    <br />* Late fee of Rs. 50/day applicable after due date.
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-500 overflow-auto">
            {/* Toolbar - Hidden in print */}
            <div className="p-4 bg-white shadow-xl flex items-center justify-between sticky top-0 z-50 print:hidden max-w-5xl mx-auto mt-4 rounded-xl border border-gray-200">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg font-bold text-gray-600 transition-all"
                >
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 font-mono text-sm hidden sm:inline">Reference: {challan.challanNumber}</span>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                        <Printer size={18} /> Print Now
                    </button>
                </div>
            </div>

            {/* A4 Page Container */}
            <div className="print:m-0 print:p-0 flex justify-center p-8 bg-gray-500 min-h-screen">
                <div className="w-[297mm] h-[210mm] bg-white shadow-2xl flex p-[2mm] gap-0 border border-gray-200 overflow-hidden print:w-full print:border-none print:shadow-none print:p-0">
                    <ChallanCopy title="School Copy" />
                    <ChallanCopy title="Bank Copy" />
                    <ChallanCopy title="Student Copy" hideBorder />
                </div>
            </div>

            {/* Print Specific CSS */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body { background: white !important; padding: 0 !important; margin: 0 !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:m-0 { margin: 0 !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:w-full { width: 100% !important; }
                    .print\\:border-none { border: none !important; }
                    .print\\:shadow-none { shadow: none !important; }
                    @page { size: landscape; margin: 0; }
                }
            `}} />
        </div>
    );
};

export default ChallanPrintView;

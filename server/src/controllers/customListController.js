const CustomList = require('../models/CustomList');

// @desc    Get a custom list
// @route   GET /api/lists/:listId
// @access  Private
exports.getList = async (req, res) => {
    try {
        const { listId } = req.params;
        let list = await CustomList.findOne({ listId });

        if (!list) {
            // Return an empty template if it doesn't exist yet
            return res.status(200).json({ listId, name: listId, items: [] });
        }

        res.status(200).json(list);
    } catch (err) {
        console.error('Error fetching custom list:', err);
        res.status(500).json({ message: 'Error fetching custom list', error: err.message });
    }
};

// @desc    Update a custom list
// @route   PUT /api/lists/:listId
// @access  Private (Admin typically)
exports.updateList = async (req, res) => {
    try {
        const { listId } = req.params;
        const { name, items } = req.body;

        if (!Array.isArray(items)) {
            return res.status(400).json({ message: 'Items must be an array of strings' });
        }

        // Deduplicate and remove empty items
        const uniqueItems = [...new Set(items.map(i => i.trim()).filter(i => i))];

        const updatedList = await CustomList.findOneAndUpdate(
            { listId },
            {
                listId,
                name: name || listId,
                items: uniqueItems
            },
            { new: true, upsert: true }
        );

        res.status(200).json(updatedList);
    } catch (err) {
        console.error('Error updating custom list:', err);
        res.status(500).json({ message: 'Error updating custom list', error: err.message });
    }
};

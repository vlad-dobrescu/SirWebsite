const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    nume: String,
    pret: Number,
    poze: {
        type: [String],
    },
    descriere: String,
    categorie: String,
});

module.exports = mongoose.model('produse', ProductSchema);
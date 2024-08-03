const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  nume: { type: String, required: true },
  pret: { type: Number, required: true },
  descriere: { type: String, required: true },
  categorie: { type: String, required: true },
  variatii: [
    {
      culoare: { type: String, required: true },
      marimi: [
        {
          marime: { type: String, required: true },
          cantitate: { type: Number, required: true },
          imagini: [String],
        },
      ],
    },
  ],
});

module.exports = mongoose.model('produse', ProductSchema);

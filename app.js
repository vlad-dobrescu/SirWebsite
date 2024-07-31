const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const multer = require('multer');
const ejs = require('ejs');

const Product = require('./server/product.model');
const admin = require('./server/firebase');
const sendEmail = require('./server/emailVerification');
const uploadToGcs = require('./server/uploadToGcs');

const app = express();

dotenv.config();

const PORT = process.env.PORT || 8000;
const mongoURL = process.env.MONGO_URL;

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static('static'));
app.set('view engine', 'ejs');

mongoose.connect(mongoURL).then(() => { // Connect to MongoDB
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.log('Error connecting to MongoDB', error);
});

app.get('/', async (req, res) => {
  try {
    const productData = await Product.find();
    console.log('productData:', productData);
    res.render('pages/index', { productData });
  } catch (error) {
    console.log('Error getting products', error);
    res.status(500).send('Error getting products');
  }
  
});

app.get('/admin', (req, res) => {
  res.render('pages/admin');
});

app.get('/signup', (req, res) => {
  res.render('pages/signup');
});

app.get('/produse', async (req, res) => {
  try {
    const productData = await Product.find();
    res.json(productData);
  } catch (error) {
    console.log('Error getting products', error);
    res.status(500).send('Error getting products');
  }
});

/* CREATE EMAIL ACCOUNT AND SEND VERIFICATION LINK */
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);

  try {
    
    const user = await admin.auth().createUser({
      email,
      password,
    });
    
    const verificationLink = await admin.auth().generateEmailVerificationLink(email);
    console.log(verificationLink);

    await sendEmail(email, 'Verificați-vă e-mailul', `Apăsați pe link pentru a verifica e-mailul: ${verificationLink}`); 

    res.redirect('/');
  } catch (error) {
    console.log("Error in creating new firebase email user", error);
    res.status(500).send("Error creating user");
  }
});


/* 
  CRUD OPERATIONS
  FOR
  /ADMIN ROUTE
*/

//create
app.post('/admin/create', upload.array('imagine'), async (req, res) => {
  try {
    // console.log('req.body:', req.body);
    // console.log('req.files:', req.files);

    if (!req.files || req.files.length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    const { nume, pret, descriere, categorie } = req.body;
    const files = req.files;

    // Upload files to GCS and get their URLs
    const imageUrls = await Promise.all(files.map(file => uploadToGcs(file)));

    console.log('imageUrls:', imageUrls);
    // Create a new product
    const newProduct = new Product({
      nume: nume,
      pret: pret,
      descriere: descriere,
      categorie: categorie,
      poze: imageUrls,
    });

    // console.log('newProduct:', newProduct);
    // Save the product to MongoDB
    await newProduct.save();

    res.status(201).send('Product added successfully');
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).send('Server Error');
  }
});
//update
app.post('/admin/update', upload.array('imagine'), async (req, res) => {
  const id = req.body.id;
  const { nume, pret, descriere, categorie } = req.body;
  const files = req.files;

  if (!id) {
    return res.status(400).send('Product ID is required for update.');
  }

  let imageUrls = [];
  if (files && files.length > 0) {
    imageUrls = await Promise.all(files.map(file => uploadToGcs(file)));
  }

  const updatedProduct = {
    nume: nume,
    pret: pret,
    descriere: descriere,
    categorie: categorie,
  };

  if (imageUrls.length > 0) {
    updatedProduct.poze = imageUrls;
  }

  try {
    const product = await Product.findByIdAndUpdate(id, updatedProduct, { new: true });
    res.json(product);
  } catch (error) {
    console.log('Error updating product', error);
    res.status(500).send('Error updating product');
  }
});

//delete
app.post('/admin/delete', async (req, res) => {
  const id = req.body.id;

  if (!id) {
    return res.status(400).send('Product ID is required for deletion.');
  }

  try {
    await Product.findByIdAndDelete(id);
    res.status(200).send('Product deleted successfully');
  } catch (error) {
    console.log('Error deleting product', error);
    res.status(500).send('Error deleting product');
  }
});

/*
END CRUD OPERATIONS
*/

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const multer = require('multer');
const ejs = require('ejs');
const csrf = require('csurf');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const session = require('express-session');

const Cart = require('./server/cart.model');  
const Product = require('./server/product.model');
const admin = require('./server/firebase');
const sendEmail = require('./server/emailVerification');
const uploadToGcs = require('./server/uploadToGcs');
const cookieParser = require('cookie-parser');
const secret = crypto.randomBytes(64).toString('hex');
const checkAdmin = require('./server/protect-admin');

const checkAuth = (req, res, next) => {
  const sessionCookie = req.cookies.session || "";
  admin.auth().verifySessionCookie(sessionCookie, true)
    .then((userData) => {
      req.isLoggedIn = true;
      req.email = userData.email;
      next();
    })
    .catch(() => {
      req.isLoggedIn = false;
      next();
    });
};


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
app.use(bodyParser.json());
app.use(cookieParser());
app.set('view engine', 'ejs');

mongoose.connect(mongoURL).then(() => { // Connect to MongoDB
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.log('Error connecting to MongoDB', error);
});

app.get('/', async (req, res) => {
  try {
    const productData = await Product.find();
    const sessionCookie = req.cookies.session || "";

    admin
      .auth()
      .verifySessionCookie(sessionCookie, true /** checkRevoked */)
      .then((userData) => {
        console.log("Logged in:", userData.email);
        res.render('pages/index', { productData, isLoggedIn: true, email: userData.email });
      })
      .catch((error) => {
        console.log('Not logged in or error verifying session:', error);
        res.render('pages/index', { productData, isLoggedIn: false });
      });
  } catch (error) {
    console.log('Error getting products', error);
    res.status(500).send('Error getting products');
  }
});


app.get('/admin', checkAdmin , (req, res) => {
  res.render('pages/admin', { isLoggedIn: req.isLoggedIn, email: req.email });
});

app.get('/autentificare', checkAuth, (req, res) => {
  if (req.isLoggedIn) {
    return res.redirect('/contul-meu');
  }
  else res.render('pages/autentificare', { isLoggedIn: req.isLoggedIn, email: req.email });
});

app.get('/cart', checkAuth, async (req, res) => {
  try {
    const sessionId = req.cookies.session;
    const cartData = await Cart.find({ sessionId });

    const productIds = cartData.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    // Create a map for quick lookup of products by ID
    const productMap = {};
    products.forEach(product => {
      productMap[product._id] = product;
    });

    res.render('pages/cart', { cartData, productMap, isLoggedIn: req.isLoggedIn, email: req.email });
  } catch (error) {
    console.log('Error getting cart', error);
    res.status(500).send('Error getting cart');
  }
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

app.get("/contul-meu", checkAuth, (req, res) => {
  if (req.isLoggedIn) {
    res.render('pages/contul-meu', { isLoggedIn: req.isLoggedIn, email: req.email });
  } else {
    res.redirect("/autentificare");
  }
});

app.post('/cart/add', async (req, res) => {
  const { productId, color, size, quantity } = req.body;
  const sessionId = req.cookies.session;

  console.log("session id", sessionId);
  console.log(req.body);

  try {
    // Find the product and check if the requested quantity is available
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const variation = product.variatii.find(v => v.culoare === color);
    if (!variation) {
      return res.status(404).json({ error: 'Color not found' });
    }

    const sizeInfo = variation.marimi.find(m => m.marime === size);
    if (!sizeInfo) {
      return res.status(404).json({ error: 'Size not found' });
    }

    const availableQuantity = sizeInfo.cantitate;
    if (availableQuantity < quantity) {
      return res.status(400).json({ error: 'Requested quantity not available' });
    }

    const findCart = await Cart.findOne({ sessionId, productId, color, size });
    if (findCart) {
      let q = parseInt(findCart.quantity) + parseInt(quantity);
      if (q > availableQuantity) {
        return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
      }
      findCart.quantity = q;
      await findCart.save();
      res.json(findCart);
    } else {
      const newCart = new Cart({ sessionId, productId, color, size, quantity });
      await newCart.save();
      res.json(newCart);
    }
  } catch (error) {
    console.log('Error adding product to cart', error);
    res.status(500).send('Error adding product to cart');
  }
});



app.post("/sessionLogin", (req, res) => {
  const idToken = req.body.idToken.toString();

  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  admin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      (sessionCookie) => {
        const options = { maxAge: expiresIn, httpOnly: true };
        res.cookie("session", sessionCookie, options);
        res.end(JSON.stringify({ status: "success" }));
      },
      (error) => {
        res.status(401).send("UNAUTHORIZED REQUEST!");
      }
    );
});

app.get("/sessionLogout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/");
});


/* 
  CRUD OPERATIONS
  FOR
  /ADMIN ROUTE
*/

//create
app.post('/admin/create', upload.array('imagine'), async (req, res) => {
  try {
    const { nume, pret, descriere, categorie, variatii } = req.body;
    const files = req.files;

    //delete the first element of the array no shift

    variatii.splice(0, 1);

    console.log('Variatii:', variatii);
    // Parse the variations JSON
    const parsedVariations = JSON.parse(variatii);
    console.log('Parsed Variations:', parsedVariations);

    // Create a mapping from file field names to their URLs
    const fileMap = {};
    for (const file of files) {
      const url = await uploadToGcs(file);
      fileMap[file.originalname] = url;
    }

    // Populate variations with uploaded images
    parsedVariations.forEach(variation => {
      variation.marimi.forEach(size => {
        size.imagini = size.imagini.map(imageName => fileMap[imageName]);
      });
    });

    const newProduct = new Product({
      nume,
      pret,
      descriere,
      categorie,
      variatii: parsedVariations,
    });

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

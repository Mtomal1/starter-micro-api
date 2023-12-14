/********************************************************************************
 *  WEB322 – Assignment 06
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: MD Rasheduzzaman Khan Tomal ID:
 *
 *  Published URL: 
 *
 ********************************************************************************/

const express = require("express");
const path = require("path");
const legoData = require("./modules/legoSets");
const authData = require("./modules/auth-service");
const clientSessions = require("client-sessions");

const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

app.use(express.static("public"));

// Middleware for session management
app.use(
  clientSessions({
    cookieName: "session",
    secret: "r7FpTSOYKweQBZd34c9Vb0i6nDGLlJr",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60,
  })
);

// Middleware to make session data available to views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Middleware to ensure user is logged in for certain routes
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

// Home route
app.get("/", (req, res) => {
  res.render("home");
});

// About route
app.get("/about", (req, res) => {
  res.render("about");
});

// Lego sets route with optional theme filtering
app.get("/lego/sets", async (req, res) => {
  try {
    if (req.query.theme) {
      // Retrieve sets by theme
      let sets = await legoData.getSetsByTheme(req.query.theme);
      if (sets.length === 0) {
        res.status(404).render("404", { message: "No sets found for the specified theme" });
      } else {
        res.render("sets", { sets, theme: req.query.theme });
      }
    } else {
      // Retrieve all sets
      let sets = await legoData.getAllSets();
      if (sets.length === 0) {
        res.status(404).render("404", { message: "No sets found" });
      } else {
        res.render("sets", { sets, theme: "All Sets" });
      }
    }
  } catch (err) {
    // Handle errors
    res.status(404).render("404", {
      message: "I'm sorry, we're unable to find what you're looking for",
    });
  }
});

// Route to view details of a specific Lego set
app.get("/lego/sets/:num", async (req, res) => {
  try {
    let set = await legoData.getSetByNum(req.params.num);
    if (!set) {
      res.status(404).render("404", {
        message: "No set found for the specified set number",
      });
    } else {
      res.render("set", { set });
    }
  } catch (err) {
    res.status(404).render("404", {
      message: "I'm sorry, we're unable to find what you're looking for",
    });
  }
});

// Route to add a new Lego set (requires login)
app.get("/lego/addSet", ensureLogin, async (req, res) => {
  try {
    const themes = await legoData.getAllThemes();
    res.render("addSet", { themes: themes });
  } catch (err) {
    res.render("500", { message: `Error: ${err}` });
  }
});

// POST route to handle form submission and add a new set
app.post("/lego/addSet", ensureLogin, async (req, res) => {
  try {
    await legoData.addSet(req.body);
    res.redirect("/lego/sets");
  } catch (err) {
    res.render("500", { message: `Error: ${err}` });
  }
});

// Route to edit details of a Lego set (requires login)
app.get("/lego/editSet/:num", ensureLogin, async (req, res) => {
  try {
    const set = await legoData.getSetByNum(req.params.num);
    const themes = await legoData.getAllThemes();
    res.render("editSet", { set, themes });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

// POST route to handle form submission and edit a set
app.post("/lego/editSet", ensureLogin, async (req, res) => {
  try {
    await legoData.editSet(req.body.set_num, req.body);
    res.redirect("/lego/sets");
  } catch (err) {
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

// Route to delete a Lego set (requires login)
app.get("/lego/deleteSet/:num", ensureLogin, async (req, res) => {
  try {
    await legoData.deleteSet(req.params.num);
    res.redirect("/lego/sets");
  } catch (err) {
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});

// Login route
app.get("/login", (req, res) => {
  res.render("login");
});

// Registration route
app.get("/register", (req, res) => {
  res.render("register");
});

// POST route to handle user registration
app.post("/register", (req, res) => {
  authData
    .registerUser(req.body)
    .then(() => res.render("register", { successMessage: "User created" }))
    .catch((err) =>
      res.render("register", { errorMessage: err, userName: req.body.userName })
    );
});

// POST route to handle user login
app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };
      res.redirect("/lego/sets");
    })
    .catch((err) => {
      res.render("login", { errorMessage: err, userName: req.body.userName });
    });
});

// Route to handle user logout
app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

// Route to view user login history (requires login)
app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

// Catch-all route for handling 404 errors
app.get("*", (req, res) => {
  res
    .status(404)
    .render("404", { message: "The requested page does not exist", req: req });
});

// Initialize data modules and start the server
legoData
  .initialize()
  .then(authData.initialize)
  .then(function () {
    app.listen(HTTP_PORT, function () {
      console.log(`app listening on:  ${HTTP_PORT}`);
    });
  })
  .catch(function (err) {
    console.log(`unable to start server: ${err}`);
  });

/********************************************************************************
*  WEB322 – Assignment 04
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: MD Rasheduzzaman Khan Tomal ID: 112315221 
*
********************************************************************************/

const legoData = require("./modules/legoSets");
const path = require("path");
const express = require("express");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Set the view engine to utilize EJS templates
app.set("view engine", "ejs");

// Enable serving static files from the "public" directory
app.use(express.static("public"));

// Handle the root route and render the "home" template
app.get("/", async (req, res) => {
  try {
    res.render("home");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Handle the "/about" route and render the "about" template
app.get("/about", async (req, res) => {
  try {
    res.render("about");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Handle the "/lego/sets" route with an optional query parameter "theme"
app.get("/lego/sets", async (req, res) => {
  try {
    const theme = req.query.theme || "All Sets";
    const sets = await (req.query.theme ? legoData.getSetsByTheme(req.query.theme) : legoData.getAllSets());

    if (sets.length === 0) {
      res.status(404).render("404", { message: `No sets found for the specified theme "${theme}"` });
    } else {
      res.render("sets", { sets, theme });
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Handle the "/lego/sets/:num" route for retrieving details of a specific set
app.get("/lego/sets/:num", async (req, res) => {
  try {
    const set = await legoData.getSetByNum(req.params.num);

    if (!set) {
      res.status(404).render("404", { message: "No set found for the specified set number" });
    } else {
      res.render("set", { set });
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Handle all other routes and render a generic "404" template
app.get("*", (req, res) => {
  res.status(404).render("404", { message: "The requested page does not exist" });
});

// Initialize Lego data and start the server on the specified port
legoData.initialize().then(() => {
  app.listen(HTTP_PORT, () => {
    console.log(`Server is running on port ${HTTP_PORT}`);
  });
});

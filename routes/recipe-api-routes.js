const express = require('express');
const db = require('../models/Recipe');
const api = require('../utils/axios');
const { authCheck } = require('../middleware/auth');

const app = express();

// Find all Recipies and return them to the user with res.render
app.get('/dashboard', (req, res) => {
  db.findAll({
    where: {
      googleId: req.user.googleId,
    },
  }).then((dbRecipe) => {
    res.render('dashboard',
      {
        dbRecipe,
        displayName: req.user.displayName,
        firstName: req.user.firstName,
        surname: req.user.surname,
        avatar: req.user.avatar,
        id: req.user.googleId,
      });
  });
});

// PUT route for create or updating comments
app.put('/api/dashboard/:id', (req, res) => {
  db.update(
    { comments: req.body.newComment },
    {
      where: {
        id: req.params.id,
      },
    },
  ).then((dbRecipe) => {
    res.render('dashboard', { recipe: dbRecipe });
  });
});

// Route for search results (all parameters)
app.get('/api/recipe/:search/:cuisine/:diet/:allergy', authCheck, async (req, res) => {
  let searchTerm = req.params.search;
  let cuisinePref = req.params.cuisine;
  let dietPref = req.params.diet;
  let allergies = req.params.allergy;
  if (searchTerm === 'blank') {
    searchTerm = '';
  }

  if (cuisinePref === 'blank') {
    cuisinePref = '';
  }

  if (dietPref === 'blank') {
    dietPref = '';
  }

  if (allergies === 'blank') {
    allergies = '';
  }
  try {
    const recipeList = await db.findAll({
      where: {
        googleId: req.user.googleId,
      },
      attributes: ['recipeId'],
    });
    const idArray = recipeList.map((recipe) => recipe.dataValues.recipeId);
    console.log(idArray);
    const data = await api.userSearch(searchTerm, cuisinePref, dietPref, allergies);
    const recipeId = (data.results.map((recipe) => recipe.id)).toString();
    const recipeSearch = await api.recipeInBulk(recipeId);
    const instructions = recipeSearch.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      summary: recipe.instructions,
      cuisine: recipe.cuisines,
      vegan: recipe.vegan,
      vegetarian: recipe.vegetarian,
      imageUrl: recipe.image,
      time: recipe.readyInMinutes,
      isInDb: idArray.includes(recipe.id),
    }));
    res.render('recipe', {
      recipes: instructions,
      searchTerm,
      cuisinePref,
      dietPref,
      allergies,
      googleId: req.user.googleId,
      avatar: req.user.avatar,
      displayName: req.user.displayName,
    });
  } catch (err) {
    console.error('ERROR - recipe-api-routes.js - get/api/recipe', err);
  }
});

app.post('/api/recipe', async (req, res) => {
  db.create({
    id: req.body.id,
    googleId: req.body.googleId,
    recipeId: req.body.recipeId,
    title: req.body.title,
    summary: req.body.summary,
    cuisine: req.body.cuisine,
    vegetarian: req.body.vegetarian,
    imageUrl: req.body.imageUrl,
    time: req.body.time,
    comments: req.body.comments,
  })
    .then((dbRecipe) => {
      if (dbRecipe.affectedRows === 0) {
        return res.status(500).end();
      }

      res.status(200);
      //  res.render('recipe', { dbRecipe });
    });
});

app.delete('/api/recipe/:id', (req, res) => {
  // Delete the Recipe with the id available to us in req.params.id
  db.destroy({
    where: {
      id: req.params.id,
    },
  }).then((dbRecipe) => {
    res.json(dbRecipe);
  });
});

module.exports = app;

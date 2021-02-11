const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors= require('./cors')
const Favorites = require('../models/favorite');
var authenticate = require('../authenticate');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());


favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) =>
    {res.sendStatus(200)})
    .get(cors.cors,(req,res,next) => {
        Favorites.find({user: req.user._id})
            .populate('dishes')
            .populate('user')
            .exec((err,favorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post( authenticate.verifyUser,  function (req, res, next) {
        Favorites.findOne({user: req.user_id}, function (err, favorite) {
            if (err) throw err;
            if (!favorite) {
                Favorites.create(req.body, function (err, favorite) {
                    if (err) throw err;
                    console.log('Favorite created!');
                    favorite.user = req.user._id;
                    favorite.dishes.push(req.body._id);
                    favorite.save(function (err, favorite) {
                        if (err) throw err;
                        res.json(favorite);
                    });
                });
            } else {
                var dish = req.body._id;

                if (favorite.dishes.indexOf(dish) == -1) {
                    favorite.dishes.push(dish);
                }
                favorite.save(function (err, favorite) {
                    if (err) throw err;
                    res.json(favorite);
                });
            }
        });
    })

    .delete(authenticate.verifyUser, function (req, res, next) {
        Favorites.remove({user: req.user._id}, function (err, resp) {
            if (err) throw err;
            res.json(resp);
        });
    });

favoriteRouter.route('/:dishId')

    .delete(authenticate.verifyUser, function (req, res, next) {
        Favorites.findOneAndUpdate({user: req.user._id}, {$pull: {dishes: req.params.dishId}}, function (err, favorite) {
            if (err) throw err;
            Favorites.findOne({user: req.user._id}, function(err, favorite){
                res.json(favorite);
            });
        });
    });


module.exports = favoriteRouter;
//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

if (!process.env.DBURL) {
  const helper = require('./helper');
  mongoose.connect(helper.dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
} else {
  mongoose.connect(process.env.DBURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}


mongoose.set('useFindAndModify', false);

const itemsSchema = {
  name: String
};

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'Welcome to To Do List!'
});

const item2 = new Item({
  name: 'To insert new item click + sign.'
});

const item3 = new Item({
  name: 'To delete an item click checkbox next to it.'
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);


app.get("/", function (req, res) {

  Item.find({}, function (err, results) {
    if (err) {
      console.log(err);
    } else {
      if (results.length === 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log('Successfully inserted!');
          }
          res.redirect('/');
        });
      } else {
        res.render("list", {
          listTitle: 'Today',
          newListItems: results
        });
      }
    }
  });
});

app.get('/:place', function (req, res) {
  const place = _.capitalize(req.params.place);

  List.findOne({
    name: place
  }, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      if (result) {
        // show an existing list
        res.render('list', {
          listTitle: result.name,
          newListItems: result.items
        });
      } else {
        // create a new list
        const list = new List({
          name: place,
          items: defaultItems
        });
        list.save(function (err) {
          if (!err) {
            res.redirect('/' + place);
          }
        });
      }
    }
  });
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName === 'Today') {
    item.save(function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/');
      }
    });

  } else {
    List.findOne({
      name: listName
    }, function (err, foundList) {
      if (!err) {
        foundList.items.push(item);
        foundList.save(function (err) {
          if (err) {
            console.log(err);
          } else {
            res.redirect('/' + listName);
          }
        });
      }
    });
  }
});

app.post('/delete', function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.deleteOne({
      _id: checkedItemId
    }, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('Successfully deleted item from DB.');
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function (err, foundList) {
      if (!err) {
        res.redirect('/' + listName);
      }
    })
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server has started succesfully.");
});
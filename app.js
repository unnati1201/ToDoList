const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();
let day = "";
// let items = ["Complete assigment","Write an essay","Read a Chapter"];
// let workItems = [];

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost: 27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name: "Complete Assignment"
});

const item2 = new Item({
  name: "Write An Essay"
});

const item3 = new Item({
  name: "Read a Chapter"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.post("/", (req,res)=>{
  // if(req.body.list === "Work"){
  //   workItems.push(req.body.newItem);
  //   res.redirect("/work");
  // }else{
  //   items.push(req.body.newItem);
  //   res.redirect("/");
  // }

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  let day = date();

  if(listName === "today"){
    item.save();
    res.redirect("/");
  }else{
    Item.findOne({name: listName}, (err, foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", (req,res)=>{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listTitle;
  if(listName === "today"){
    Item.findByIdAndRemove(checkedItemId, (err)=>{
      if(!err){
        console.log("Successfully deleted the item");
        res.redirect("/");
      }else{
        List.findOneAndUpdate(
          {name: listName},
          {$pull: {items: {_id: checkedItemId}}},
          (err, foundList)=>{
            if(!err){
              res.redirect("/" + listName);
            }else{
              console.log(err);
            }
          }
        )
      }
    });
  }

});

app.get("/", (req, res) => {

  Item.find({},(err, foundItems)=>{
    if(err){
      console.log(err);
    }else{
      if(foundItems === 0){
        Item.insertMany(defaultItems, (err)=>{
          if(err){
            console.log(err);
          }else{
            console.log("Successfully inserted all the items");
          }
        });
      }
      let day = date();
      // let day = date.getDate();
      res.render("list", {listTitle: "today", newItemsAdd : foundItems});
    }
  });
});

app.get("/:customListName",(req,res)=>{

  const customListName = _.capitalize([string="req.params.customListName"]);

  List.findOne({name: customListName}, (err, foundList)=>{
    if(!err){
      if(foundList){
        res.render("list", {listTitle: customListName, newItemsAdd : foundList.items})
      }else{
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+ customListName);
      }
    }
  });

});

// app.get("/work", (req,res)=>{
//   res.render("list", {listTitle: "Work", newItemsAdd : workItems})
// })
app.listen(3000, () => {
  console.log("Server running on port 3000");
})

# Health and Fitness Club Management System

This repository contains the implementation of a Health and Fitness Club Management System. It contains functionality for three kinds of users: Members, Trainers and Administrative staff.

### 1. Setting up the Database
1. Clone this repo `git clone https://github.com/mayeen-ayoub/comp-3005-project.git`
1. Create a database of your choice using pgAdmin 4
	- In the top left corner, right click Databases dropdown
	- Hover over Create and then hover over the submenu Database
	- Name the database
	- Click save
1. With the correct database selected, click the query tool in the top left corner (or you can right click on the database and select query tool)
1. Click the open file tool in the panel that just opened and import the [DDL.sql](SQL/DDL.sql) file
1. Run the file to create the tables and triggers
2. Next, import the [DML.sql](SQL/DML.sql) file
3. Run the file to insert data into the newly created tables

### 2. Run the Scripts
1. In the project directoy, run `npm install`
1. Modify the [config.js](config.js) file to connect to the database accordingly
1. Run `node main.js`
1. For some of the functions, you will be prompted for information to add/update/delete, please fill these values in and press enter.
1. If you want to see the changes the scripts made, you can run `SELECT * FROM <Table_Name>;` in pgAdmin 4

### Notes:
- The database connection terminates once all the functions have been executed. If you do not want this functionality comment out `client.end();` from the `main()` function
- All the functions will be run unless you comment them out

### Demo Video: 
The demo video can be found [here](https://youtu.be/620awISqDG0).
<!-- - Note: Since there was no explicit requirement to show the operations happening simultaneously in pgAdmin, we’ve decided to spend the demo time focusing on the console application. That said, every operation has an underlying SQL component - for example, the view functions are essentially `SELECT` statements that return all the related records in a given table. -->


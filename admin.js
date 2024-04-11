const prompt = require('prompt-sync')();
const TableDisplay = require('./tableDisplay.js');

class Admin {	
  constructor(client) {
    this.client = client;
    this.tableDisplay = new TableDisplay();
  }

  async #checkIfAdmin() {
    try {
      const email = prompt("Enter admin email: ");
      const password = prompt("Enter password: ");
      const dbPasswordResult = await this.client.query('SELECT id, password FROM Admin WHERE email = $1;', [email]);
      const dbPassword = dbPasswordResult?.rows[0]?.password;

      if (dbPasswordResult?.rowCount === 0 || password !== dbPassword) {
        console.log(`Incorrect user or password. Terminating...`);
        return null;
      }
      return dbPasswordResult.rows[0].id;
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return null;
    }
  }

  async bookRoom() {
    try {
      const adminId = await this.#checkIfAdmin();
      if (adminId !== null) {
        const roomNumber = prompt("Which room would you like to book? ");
        const eventType = prompt("What kind of event are you booking the room for (group session, birthday party, etc.)? ");
        const date = prompt("What date are you booking the room for (yyyy-mm-dd)? ");
        const startTime = prompt("What time does the event start (eg. type 1:30 for 1:30am and 13:30 for 1:30pm)? ");
        const endTime = prompt("What time does the event end (eg. type 1:30 for 1:30am and 13:30 for 1:30pm)? ");

        const insertQuery = `
            INSERT INTO Room_Booking (room_number, event_type, date, start_time, end_time) VALUES ($1, $2, $3, $4, $5);
        `;
        await this.client.query(insertQuery, [roomNumber, eventType, date, startTime, endTime]);
        console.log("The room booking has been saved.");
      }
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  async manageEquipment() {
    try {
      const adminId = await this.#checkIfAdmin();
      if (adminId !== null) {
        console.log('How do you want modify the equipment?');
        console.log('1. Add a new machine');
        console.log('2. Update a current machine');
        console.log('3. Delete a machine');
        console.log('4. View machines');
        const selection = parseInt(prompt('Type the corresponding number to make a selection: '));
        
        switch (selection) {
          case 1:
            await this.#addEquipment();
            break;
          case 2:
            await this.#updateEquipment();
            break;
          case 3:
            await this.#deleteEquipment()
            break;
          default:
            await this.#viewEquipment();
        }
      }
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  async #viewEquipment() {
    try {
      const allEquipment = await this.client.query('SELECT * FROM Equipment;');
      const headers = ['id', 'Need Maintenance?', 'Last Maintained On'];
      this.tableDisplay.printResultsAsTable(allEquipment, headers, true, ['last_maintained']);
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  async #addEquipment() {
    try {
      const needsMaintenanceInput = prompt("Does the machine need maintenance? Y/N: ").toLowerCase();
      const needsMaintenance = needsMaintenanceInput === "y" ? 'true' : 'false';
      const lastMaintained = prompt("When was the machine last maintained (yyyy-mm-dd)? ");

      const insertQuery = `
        INSERT INTO Equipment (needs_maintenance, last_maintained) VALUES ($1, $2);
      `;

      await this.client.query(insertQuery, [needsMaintenance, lastMaintained]);
      console.log("The machine has been added successfully.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  async #updateEquipment() {
    try {
      await this.#viewEquipment();

      const idSelection = parseInt(prompt('Please type the id of the machine you want to modify: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }

      console.log('***Make any changes when prompted. If nothing is entered, nothing will change for that field.');
      const needsMaintenanceInput = prompt("Does the machine need maintenance? Y/N: ").toLowerCase();
      let needsMaintenance;
      if (needsMaintenanceInput === "y") {
        needsMaintenance = 'true';
      } else if (needsMaintenanceInput === "n") {
        needsMaintenance = 'false';
      }
      let lastMaintained = prompt("When was the machine last maintained (yyyy-mm-dd)? ");

      if (!needsMaintenance || !lastMaintained) {
        const result = await this.client.query('SELECT * FROM Equipment WHERE id=$1', [idSelection]);
        const equipmentToChange = result?.rows[0];
        needsMaintenance = !needsMaintenance ? equipmentToChange.needs_maintenance : needsMaintenance;
        lastMaintained = !lastMaintained ? equipmentToChange.last_maintained : lastMaintained;
      }

      const updateQuery = `
        UPDATE Equipment
        SET needs_maintenance=$1, last_maintained=$2
        WHERE id=$3;
      `;

      await this.client.query(updateQuery, [needsMaintenance, lastMaintained, idSelection]);
      console.log("The machine has been updated successfully.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  async #deleteEquipment() {
    try {
      await this.#viewEquipment();
      
      const idSelection = parseInt(prompt('Please type the id of the machine you want to delete: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }

      const deleteQuery = `
        DELETE FROM Equipment
        WHERE id=$1;
      `;

      await this.client.query(deleteQuery, [idSelection]);
      console.log("The machine has been deleted successfully.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  async manageBilling() {
    const adminId = await this.#checkIfAdmin();
    if (adminId !== null) {
      console.log('How do you want modify the invoices?');
      console.log('1. Add a new invoice');
      console.log('2. Update a current invoice');
			console.log('3. Delete an invoice');
      console.log('4. View invoices');
      const selection = parseInt(prompt('Type the corresponding number to make a selection: '));

      switch (selection) {
        case 1:
          await this.#addNewBill();
          break;
        case 2:
          await this.#updateBill();
          break;
        case 3:
          await this.#deleteBill();
          break;
        default:
          await this.#viewBills();
      }
    }
  }

  async #viewBills() {
    try {
      const allBills = await this.client.query('SELECT * FROM Bill;');
      const headers = ['id', 'Member id', 'Amount ($)', 'Fee Type', 'Invoice Date', 'Payment Date'];
      this.tableDisplay.printResultsAsTable(allBills, headers, true, ['invoice_date', 'payment_date']);
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  async #addNewBill() {
    try {
      const memberIdSelection = await this.#promptMemberId();
			if (!memberIdSelection) {
				console.log("No valid id was entered. Terminating request...");
				return;
			}
      const amount = parseFloat(prompt('Please type the amount of the invoice: ')).toFixed(2);
      const feeType = prompt('Please enter the type of fee (ex. membership fee, group session fee, etc.): ');
      const invoiceDate = prompt('Please enter the date of the invoice (yyyy-mm-dd): ');
      let paymentDate = null;
      const hasPaid = prompt("Has the invoice been paid yet? Y/N: ").toLowerCase();
      if (hasPaid === "y") {
        paymentDate = prompt('Please enter the date the invoice was paid (yyyy-mm-dd): ');
      }

      const insertQuery = `
        INSERT INTO Bill (member_id, amount, fee_type, invoice_date, payment_date) VALUES ($1, $2, $3, $4, $5);
      `;

      await this.client.query(insertQuery, [memberIdSelection, amount, feeType, invoiceDate, paymentDate]);
      console.log("The invoice has been added successfully.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  async #updateBill() {
    try {
      await this.#viewBills();

      const idSelection = parseInt(prompt('Please type the id of the invoice you want to modify: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }

      let memberIdSelection;
      const isUpdatingMemberId = prompt("Would you like to update the member id of this invoice? Y/N: ").toLowerCase();
      if (isUpdatingMemberId === "y") {
        memberIdSelection = await this.#promptMemberId();
        if (!memberIdSelection) {
          console.log("No valid id was entered. Terminating request...");
          return;
        }
      }

      console.log('***Make any changes when prompted. If nothing is entered, nothing will change for that field.');
      let amount = parseFloat(prompt('Please type the amount of the invoice: ')).toFixed(2);
      let feeType = prompt('Please enter the type of fee (ex. membership fee, group session fee, etc.): ');
      let invoiceDate = prompt('Please enter the date of the invoice (yyyy-mm-dd): ');
      let paymentDate = null;
      const hasPaid = prompt("Has the invoice been paid yet? Y/N: ").toLowerCase();
      if (hasPaid === "y") {
        paymentDate = prompt('Please enter the date the invoice was paid (yyyy-mm-dd): ');
      }

      if (isUpdatingMemberId === "y" || !amount || !feeType || !invoiceDate || !paymentDate) {
        const result = await this.client.query('SELECT * FROM Bill WHERE id=$1', [idSelection]);
        const billToChange = result?.rows[0];
        memberIdSelection = isUpdatingMemberId === "y" ? memberIdSelection : billToChange.member_id;
        amount = isNaN(amount) ? billToChange.amount : amount;
        feeType = !feeType ? billToChange.fee_type : feeType;
        invoiceDate = !invoiceDate ? billToChange.invoice_date : invoiceDate;
        paymentDate = !paymentDate ? billToChange.payment_date : paymentDate;
      }
      const updateQuery = `
        UPDATE Bill
        SET member_id=$1, amount=$2, fee_type=$3, invoice_date=$4, payment_date=$5
        WHERE id=$6;
      `;

      await this.client.query(updateQuery, [memberIdSelection, amount, feeType, invoiceDate, paymentDate, idSelection]);
      console.log("The invoice has been updated successfully.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  async #deleteBill() {
    try {
      await this.#viewBills();

      const idSelection = parseInt(prompt('Please type the id of the invoice you want to delete: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }

      const deleteQuery = `
        DELETE FROM Bill
        WHERE id=$1;
      `;

      await this.client.query(deleteQuery, [idSelection]);
      console.log("The invoice has been deleted successfully.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  async #promptMemberId() {
    const allMembers = await this.client.query('SELECT id, first_name, last_name, email, phone_number, join_date FROM Member;');
    const headers = ['id', 'First Name', 'Last Name', 'Email', 'Phone Number', 'Join Date'];
    this.tableDisplay.printResultsAsTable(allMembers, headers,  true, ['join_date']);

    const memberIdSelection = parseInt(prompt('Please type the id of the member you want to invoice: '));
    return memberIdSelection;
  }
}
module.exports = Admin;

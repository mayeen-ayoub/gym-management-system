const prompt = require('prompt-sync')();

class Member {	
  constructor(client) {
    this.client = client;
  }

  async checkIfMember() {
    try {
      const email = prompt("Enter member email: ");
      const password = prompt("Enter password: ");
      const dbPasswordResult = await this.client.query('SELECT id, password FROM Member WHERE email = $1;', [email]);
      const dbPassword = dbPasswordResult?.rows[0]?.password;

      if (dbPasswordResult?.rowCount === 0 || password !== dbPassword) {
        console.log(`Incorrect password. Terminating...`);
        return null;
      }
      return dbPasswordResult.rows[0].id;
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return null;
    }
  }

  async register() {
    try {
      const firstName = prompt("Enter your first name: ");
      const lastName = prompt("Enter your last name: ");
      const email = prompt("Enter your email: ");
      const password = prompt("Enter your password: ");
      let phoneNumber = null;
      const wantsPhoneNumber = prompt("Would you like to associate a phone number with your profile? Y/N: ").toLowerCase();
      if (wantsPhoneNumber === "y") {
        phoneNumber = prompt("Enter your phone number: ");
      }

      const insertMemberQuery = `
        INSERT INTO Member (first_name, last_name, email, password, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING id;
      `;

      const result = await this.client.query(insertMemberQuery, [firstName, lastName, email, password, phoneNumber]);
      const memberId = result.rows[0].id;

      console.log(`Welcome ${firstName}! It's now time to set your fitness goals.`);
      let targetWeight = null;
      let targetTime = null;
      let targetCalories = null;
      const wantsTargetWeight = prompt("Would you like to set a target weight? Y/N: ").toLowerCase();
      if (wantsTargetWeight === "y") {
        targetWeight = parseInt(prompt("Enter your target weight (in pounds): "));
      }
      const wantsTargetTime = prompt("Would you like to set a target time to spend at the gym each week? Y/N: ").toLowerCase();
      if (wantsTargetTime === "y") {
        targetTime = parseFloat(prompt("Enter your target time (in hours): "));
      }
      const wantsTargetCalories = prompt("Would you like to set a target number of calories to burn each week? Y/N: ").toLowerCase();
      if (wantsTargetCalories === "y") {
        targetCalories = parseInt(prompt("Enter your target calories: "));
      }

      const insertFitnessGoalQuery = `
        INSERT INTO Fitness_Goal (member_id, target_weight, target_time, target_calories) VALUES ($1, $2, $3, $4);
      `;

      await this.client.query(insertFitnessGoalQuery, [memberId, targetWeight, targetTime, targetCalories]);

      console.log("Thanks for registering! Your information and fitness goals have been saved.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }
}
module.exports = Member;

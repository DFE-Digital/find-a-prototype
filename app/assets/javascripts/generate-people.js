const { faker } = require("@faker-js/faker");
const fs = require("fs");

// Function to generate a random date of birth for individuals between 18 and 65 years old
function generateDOB() {
  // Get the current date
  const currentDate = new Date();

  // Subtract 65 years from the current date
  const sixtyFiveYearsAgo = new Date();
  sixtyFiveYearsAgo.setFullYear(currentDate.getFullYear() - 65);

  // Subtract 18 years from the current date
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(currentDate.getFullYear() - 18);

  return faker.date.between({ from: sixtyFiveYearsAgo, to: eighteenYearsAgo });
}

// Function to generate a unique 9-digit code
function generateUniqueID(seed) {
  faker.seed(seed);
  const startLetters = faker.string.alpha({
    casing: "upper",
    length: 2,
  });
  const oneNumbers = faker.string.numeric(2);
  const twoNumbers = faker.string.numeric(1).concat("F");
  const threeNumbers = faker.string.numeric(2);
  const endLetter = faker.string.alpha({
    casing: "upper",
    length: 1,
  });
  const id = startLetters.concat(" ", oneNumbers, " ", twoNumbers, " ", threeNumbers, " ", endLetter);
  return id;
}

function generateCourses(quantity) {
  // Generate data for JSON objects
  let data = [];

  for (let i = 1; i <= quantity; i++) {
    const id = generateUniqueID(i);
    const givenName = faker.person.firstName();
    const familyName = faker.person.lastName();
    const dateOfBirth = generateDOB();
    const jobTitle = faker.person.jobTitle();
    const favouriteFood = faker.food.dish();
    const car = {
      type: faker.vehicle.type(),
      make: faker.vehicle.manufacturer(),
      model: faker.vehicle.model(),
    };

    const person = {
      id,
      familyName,
      givenName,
      dateOfBirth,
      jobTitle,
      favouriteFood,
      car,
    };

    data.push(person);
  }

  // Write data to people.json

  const jsonFilePath = "./app/data/people.json";

  fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));

  //reset seed
  faker.seed(Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER));

  return console.log(`JSON data written to ${jsonFilePath}`);
}

module.exports = { generatePeople };

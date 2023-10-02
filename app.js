const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const databasePath = path.join(__dirname, "covid19India.db");
const app = express();

let database = null;
const initializeDbandServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3002, () =>
      console.log("server is running at https//:localhost:3002/")
    );
  } catch (error) {
    console.log(`Db error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbandServer();

const convertStateObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    curved: dbObject.curved,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state;`;
  const states = await database.all(getStatesQuery);
  response.send(
    states.map((eachState) => convertStateObjectToResponseObject(eachState))
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM state WHERE state_id = ${stateId}`;
  const state = await database.get(getStateQuery);
  response.send(convertStateObjectToResponseObject(state));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, curved, active, deaths } = request.body;
  const postDistrictsQuery = `
    INSERT INTO
     district (district_name,state_id,cases,cured,active,deaths) 
     VALUES ('${districtName}','${stateId}','${cases}','${curved}','${active}','${deaths}');`;
  const dbResponse = await database.run(postDistrictsQuery);
  const newDist = dbResponse.lastID;
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT
     * 
    FROM district 
    WHERE district_id=${districtId};`;
  const district = await database.get(getDistrictQuery);
  response.send(convertDistrictObjectToResponseObject(district));
});

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district WHERE district_id=${districtId};`;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, curved, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateQuery = `
    INSERT INTO district 
    SET 
    district_name='${districtName}',
    state_id='${stateId}',
    cases='${cases}',
    curved='${curved}',
    active='${active}',
    deaths='${deaths}'
    WHERE 
    district_id=${districtId};`;
  const updateDistrict = await database.run(updateQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatasticsQuery = `
    SELECT sum(cases),
    SUM(curved),
    SUM(active),
    SUM(deaths)
    FROM 
    district
    WHERE
    state_id=${stateId};`;
  const statastics = await database.get(getStatasticsQuery);
  response.send({
    totalCases: statastics["SUM(cases)"],
    totalCurved: statastics["SUM(curved)"],
    totalActive: statastics["SUM(active)"],
    totalDeaths: statastics["SUM(deaths)"],
  });
});

app.get("/districts/2/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT state_name FROM state NATURAL JOIN district
    WHERE 
    district_id=${districtId};`;
  const getDistrictQueryResponse = await database.get(getDistrictQuery);
  response.send(
    convertDistrictObjectToResponseObject(getDistrictQueryResponse)
  );
});

module.exports = app;

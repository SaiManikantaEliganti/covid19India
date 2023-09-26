const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const databasePath = path.join(__dirname, "covid19India.db");
const app = express();

const database = null;
const initializeDbandServer = async () => {
  try {
    const database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("server is running at https//:localhost:3000/")
    );
  } catch (error) {
    console.log(`Db error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbandServer();

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM states;`;
  const states = await database.all(getStatesQuery);
  response.send(states);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM states WHERE state_id=${stateId}`;
  const state = await database.get(getStateQuery);
  response.send(state);
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, curved, active, deaths } = request.body;
  const postDistrictsQuery = `
    INSERT INTO districts (district_name,state_id,cases,cured,active,deaths) VALUES ('${districtName}','${stateId}','${cases}','${curved}','${active}','${deaths}');`;
  const districts = await database.run(postDistrictsQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM districts WHERE district_id=${districtId};`;
  const district = await database.get(getDistrictQuery);
  response.send(district);
});

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM districts WHERE district_id=${districtId};`;
  deleteDistrict = await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, curved, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateQuery = `
    INSERT INTO districts 
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
    districts
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

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT state_id from districts
    WHERE 
    district_id=${districtId};`;
  const getDistrictQueryResponse = await database.get(getDistrictQuery);

  const getStateNameQuery = `SELECT state_name as stateName 
    FROM state 
    WHERE state_id=${getDistrictQueryResponse.state_id};`;
  const getStateQueryResponse = await database.get(getStateNameQuery);
  response.send(getStateQueryResponse);
});

module.exports = app;

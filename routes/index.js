var express = require('express');
var router = express.Router();
const pool = require('../db/dbConfig');
const { Client } = require('pg');

/* GET home page. */
router.get('/', function(req, res, next) {
 // res.render('index', { title: 'Express' });
 res.render('timsheetcalendar');
});



router.get('/mytask', function(req, response, next) {

  var projectName ='';
  pool
  .query('SELECT sfid, Name FROM salesforce.Contact  WHERE sfid = $1;',['0030p000009y3OzAAI'])
  .then(contactResult => {
    console.log('Name of Contact  ::     '+contactResult.rows[0].name+' sfid'+contactResult.rows[0].sfid);
    var contactId = contactResult.rows[0].sfid;
      pool
      .query('SELECT sfid, Name, Team__c FROM salesforce.Team_Member__c WHERE Representative__c = $1 ;',[contactId])
      .then(teamMemberResult => {
        console.log('Name of TeamMemberId  : '+teamMemberResult.rows[0].name+'   sfid :'+teamMemberResult.rows[0].sfid);
        console.log('Team Id  : '+teamMemberResult.rows[0].team__c);
        console.log('Number of Team Member '+teamMemberResult.rows.length);
        
        var projectTeamparams = [], lstTeamId = [];
        for(var i = 1; i <= teamMemberResult.rows.length; i++) {
          projectTeamparams.push('$' + i);
          lstTeamId.push(teamMemberResult.rows[i-1].team__c);
        } 
        var projectTeamQueryText = 'SELECT sfid, Name, Project__c FROM salesforce.Project_Team__c WHERE Team__c IN (' + projectTeamparams.join(',') + ')';
        console.log('projectTeamQueryText '+projectTeamQueryText);
        
          pool
          .query(projectTeamQueryText,lstTeamId)
          .then((projectTeamResult) => {
              console.log('projectTeam Reocrds Length '+projectTeamResult.rows.length);
              console.log('projectTeam Name '+projectTeamResult.rows[0].name);

              var projectParams = [], lstProjectId = [];
              for(var i = 1; i <= projectTeamResult.rows.length; i++) {
                projectParams.push('$' + i);
                lstProjectId.push(projectTeamResult.rows[i-1].project__c);
              } 
              console.log('lstProjectId  : '+lstProjectId);
              var projetQueryText = 'SELECT sfid, Name FROM salesforce.Milestone1_Project__c WHERE sfid IN ('+ projectParams.join(',')+ ')';

              pool.
              query(projetQueryText, lstProjectId)
              .then((projectQueryResult) => { 
                    console.log('Number of Projects '+projectQueryResult.rows.length);
                    console.log('Project sfid '+projectQueryResult.rows[0].sfid+ 'Project Name '+projectQueryResult.rows[0].name);
                    var projectList = projectQueryResult.rows;
                    var lstProjectId = [], projectParams = [];
                    var j = 1;
                    projectList.forEach((eachProject) => {
                      console.log('eachProject sfid : '+eachProject.sfid);
                      lstProjectId.push(eachProject.sfid);
                      projectParams.push('$'+ j);
                      console.log('eachProject name : '+eachProject.name);
                      j++;
                    });

                  //  var milestoneQueryText = 'SELECT Id,Name FROM salesforce.Milestone1_Milestone__c WHERE Project__c IN ('+projectParams.join(',')+') AND Name = ;
                  //  pool.query

                    var taskQueryText = 'SELECT sfid, Name FROM salesforce.Milestone1_Task__c WHERE Project_Name__c IN ('+projectParams.join(',')+')';
                    console.log('taskQueryText  : '+taskQueryText);

                    pool
                    .query(taskQueryText, lstProjectId)
                    .then((taskQueryResult) => {
                       // console.log('taskQueryResult  '+JSON.stringify(taskQueryResult.rows));
                        response.render('mycalendar',{projectList : projectQueryResult.rows, contactList : contactResult.rows, taskList : taskQueryResult.rows }); // render calendar
                    })
                    .catch((taskQueryError) => {
                        console.log('taskQueryError : '+taskQueryError.stack);
                    })
                    

                    

              })
              .catch((projectQueryError) => {
                    console.log('projectQueryError '+projectQueryError.stack);
              })
           
          })
            .catch((projectTeamQueryError) =>{
              console.log('projectTeamQueryError : '+projectTeamQueryError.stack);
            })          
        })
        .catch((teamMemberQueryError) => {
        console.log('Error in team member query '+teamMemberQueryError.stack);
        })

      }) 
      .catch(contactQueryError => console.error('Error executing contact query', contactQueryError.stack));

      
 });
 



 router.get('/getevents', function(req, res, next) {
  // res.render('index', { title: 'Express' });
  console.log('req.query :'+req.query.date);
  var strdate = req.query.date;
  console.log('typeof date '+typeof(strdate));
  var selectedDate = new Date(strdate);

  var year = selectedDate.getFullYear();
  var month = selectedDate.getMonth();
  console.log('Month '+selectedDate.getMonth());
  console.log('Year : '+selectedDate.getFullYear());
  var numberOfDays = new Date(year, month+1, 0).getDate();
  console.log('numberOfDays : '+numberOfDays);
  
  var lstEvents = [];
  for(let i = 1;i <= numberOfDays ; i++)
  {
    lstEvents.push({
        title : 'Fill Actuals',
        start : year+'-'+(month+1)+'-'+i,
        end : year+'-'+(month+1)+'-'+i
    });
    lstEvents.push({
      title : 'Create Task',
      start : year+'-'+(month+1)+'-'+i,
      end : year+'-'+(month+1)+'-'+i
    });
    lstEvents.push({
      title : 'Details',
      start : year+'-'+(month+1)+'-'+i,
      end : year+'-'+(month+1)+'-'+i
    });
    lstEvents.push({
      title : 'Planned Hours',
      start : year+'-'+(month+1)+'-'+i,
      end : year+'-'+(month+1)+'-'+i
    });
    lstEvents.push({
      title : 'Actual Hours',
      start : year+'-'+(month+1)+'-'+i,
      end : year+'-'+(month+1)+'-'+i
    });
    lstEvents.push({
      title : 'Date : '+year+'-'+(month+1)+'-'+i,
      start : year+'-'+(month+1)+'-'+i,
      end : year+'-'+(month+1)+'-'+i
    });
  } 
   //console.log('JSON.strigify '+JSON.stringify(lstEvents));
    res.send(lstEvents);
 });


 router.post('/createtask',(request, response) => {

      var formData = request.body;
      console.log('formData  '+JSON.stringify(formData));
  
      console.log('ffff '+formData.taskname);
    var taskname = formData.taskname,
          status = formData.status,
          projectname = formData.projectname, 
          taskdate = formData.taskdate, 
          assignedresource = formData.assignedresource,
          tasktype = formData.tasktype,
          plannedstarttime = formData.plannedstarttime,
          plannedendtime = formData.plannedendtime;

    console.log('taskname '+taskname);
    console.log('status : '+status);
    console.log('projectname  '+projectname);
    console.log('taskdate '+taskdate);
    var dateParts = taskdate.split('/');
  
    console.log('assignedresource  '+assignedresource);
    console.log('tasktype   '+tasktype);

    console.log('plannedstarttime  '+plannedstarttime);
    console.log('plannedendtime '+plannedendtime);

    
    pool
    .query('INSERT INTO salesforce.Milestone1_Task__c (Name, Project_Milestone__c, RecordTypeId, Task_Stage__c, Project_Name__c, Start_Date__c, Assigned_Manager__c,Task_Type__c ,Start_Time__c,End_Time__c) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[taskname,'a020p000001cObIAAU','0120p000000C8plAAC',status,projectname,taskdate,assignedresource,tasktype,plannedstarttime,plannedendtime])
    .then((saveTaskResult) => {
        console.log('saveTaskResult  : '+JSON.stringify(saveTaskResult));
        //  response.send('savedInserted');
        response.send({success : true});
    })
    .catch((saveTaskError) => {
        console.log('saveTaskError  '+saveTaskError.stack);
        response.send({success :false});
    }) 

    
 });


 router.post('/fillactuals',(request, response) => {
    var fillActualsFormData = request.body;
    console.log('fillActualsFormData  '+JSON.stringify(fillActualsFormData));
    var projectName = fillActualsFormData.projectName,
        dateIncurred = fillActualsFormData.dateIncurred,
        selectedTask = fillActualsFormData.selectedTask,
        statusTimesheet = fillActualsFormData.statusTimesheet,
        actualStartTimeTimesheet = fillActualsFormData.plannedStartTimeTimesheet,
        actualEndTimeTimesheet = fillActualsFormData.plannedEndTimeTimesheet,
        descriptionTimesheet = fillActualsFormData.descriptionTimesheet,
        representative = fillActualsFormData.representative;


    console.log('projectName  : '+projectName);
    console.log('dateIncurred   : '+dateIncurred);
    console.log('selectedTask   : '+selectedTask);
    console.log('statusTimesheet   : '+statusTimesheet);
    console.log('representative  '+representative);
    console.log('actualStartTimeTimesheet   : '+actualStartTimeTimesheet);
    console.log('actualEndTimeTimesheet  :  '+actualEndTimeTimesheet);
    console.log('descriptionTimesheet  :  '+descriptionTimesheet);
    


    pool
    .query('INSERT INTO salesforce.Milestone1_Time__c (Projecttimesheet__c, Date__c, Project_Task__c, Representative__c, Start_Time__c, End_Time__c, Description__c) VALUES($1,$2,$3,$4,$5,$6,$7)',[projectName,dateIncurred,selectedTask,representative,actualStartTimeTimesheet,actualEndTimeTimesheet,descriptionTimesheet])
    .then((timesheetQueryResult) => {
      console.log('timesheetQueryResult  '+JSON.stringify(timesheetQueryResult));
      response.send({success : true});
    })
    .catch((timesheetQueryError) => {
      console.log('timesheetQueryError  '+timesheetQueryError.stack)
      response.send({success : false});
    })

 });

 router.post('/pettycash',(request,response) =>{
    if(typeof(request.body) !== 'undefined')
    {
        console.log('request.body : '+request.body);
    }
 });


 router.get('/pettycash',(request, response)=> {
    response.render('pettycashform');
 });

module.exports = router;

import csv
import json
import datetime
import string

reader = csv.reader(open("EmployeeRecords.csv"))
#for LastName, FirstName, BirthDate, BirthCountry, Gender, CitizenshipCountry ,CitizenshipBasis, CitizenshipStartDate, PassportCountry,PassportIssueDate, PassportExpirationDate, CurrentEmploymentType, CurrentEmploymentTitle, CurrentEmploymentStartDate, EmailAddress, MilitaryServiceBranch, MilitaryDischargeType, MilitaryDischargeDate in reader:
#    print LastName, FirstName

resume_json = open('newresume.json')
resume = json.load(resume_json)
resume_json.close()

for j in reader:
	ifExist = False
	corresRecord = {}
	for i in resume:
		if j[1] in i.get("name") and j[0] in i.get("name"):
			ifExist = True
			corresRecord = i
	if ifExist:
		#corresRecord["PassportIssueDate"] = 0
		if j[9] == "":
			corresRecord["PassportIssueDate"] = 0
		else:
			s = string.split(j[9], "/")
			passportIssue = datetime.date(int(s[0]), int(s[1]), int(s[2]))
			corresRecord["PassportIssueDate"] = (passportIssue - datetime.date(1970,1,1)).total_seconds()
		corresRecord["EmailAddress"] = j[14]
		corresRecord["CurrentEmploymentType"] = j[11]
		corresRecord["CurrentEmploymentTitle"] = j[12]
		corresRecord["Gender"] = j[4]
	else:
		temp = {};
		s = string.split(j[17], "/")
		if j[17] == "":
			temp["forceDischarge"] = 0
		else:
			forceDischarge = datetime.date(int(s[0]), int(s[1]), int(s[2]))
			temp["forceDischarge"] = (forceDischarge - datetime.date(1970,1,1)).total_seconds()

		tmp = string.split(j[13], "/")
		ces = datetime.date(int(tmp[0]), int(tmp[1]), int(tmp[2]))
		temp["CurrentEmploymentStartDate"] = (ces - datetime.date(1970,1,1)).total_seconds()

		temp["name"] = j[1] + " " + j[0]
		temp["experience"] = []
		exp = {}
		exp["position"] = j[12]
		exp["location"] = "GASTech"
		exp["description"] = ""
		exp["start"] = temp["CurrentEmploymentStartDate"]
		exp["end"] = (datetime.date(2014,01,21) - datetime.date(1970,1,1)).total_seconds()
		if j[9] == "":
			temp["PassportIssueDate"] = 0
		else:
			s = string.split(j[9], "/")
			passportIssue = datetime.date(int(s[0]), int(s[1]), int(s[2]))
			temp["PassportIssueDate"] = (passportIssue - datetime.date(1970,1,1)).total_seconds()

		temp["experience"].append(exp)

		temp["specialty"] = []
		temp["EmailAddress"] = j[14]
		temp["CurrentEmploymentType"] = j[11]
		temp["CurrentEmploymentTitle"] = j[12]
		temp["Gender"] = j[4]

		resume.append(temp)

for xx in resume:
	print xx["PassportIssueDate"]

json1 = json.dumps(resume)
f = open('workfile', 'w')
f.write(json1)


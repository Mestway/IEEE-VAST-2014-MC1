import csv
import json
import datetime
import string

def string2date(v):
	year = v[0:4]
	month = v[4:6]
	day = v[6:8]

	if month == "" or int(month) == 0:
		month = "1"
	if day == "" or int(day) == 0:
		day = "1"
	if year == "" or int(year) == 0:
		year = "1970"
				
	if v != "-1":
		v = datetime.date(int(year), int(month), int(day))
	else:
		v = datetime.date(1970,1,1)

	return v



reader = csv.reader(open("EmployeeRecords.csv"))
#for LastName, FirstName, BirthDate, BirthCountry, Gender, CitizenshipCountry ,CitizenshipBasis, CitizenshipStartDate, PassportCountry,PassportIssueDate, PassportExpirationDate, CurrentEmploymentType, CurrentEmploymentTitle, CurrentEmploymentStartDate, EmailAddress, MilitaryServiceBranch, MilitaryDischargeType, MilitaryDischargeDate in reader:
#    print LastName, FirstName

resume_json = open('resume.json')
resume = json.load(resume_json)
resume_json.close()

for j in reader:
	for i in resume:
		if j[1] in i.get("name") and j[0] in i.get("name"):
			for exp in i.get("experience"):
				exp["start"] = string2date(exp["start"])
				exp["end"] = string2date(exp["end"])
				exp["start"] = (exp["start"] - datetime.date(1970, 1, 1)).total_seconds()
				exp["end"] = (exp["end"] - datetime.date(1970, 1, 1)).total_seconds()

				if "Force" in exp.get("location") or "Defense" in exp.get("location"):
					s = string.split(j[17], "/")
					print "WHH", s, i['name']
					forceDischarge = datetime.date(int(s[0]), int(s[1]), int(s[2]))
					i["forceDischarge"] = (forceDischarge - datetime.date(1970,1,1)).total_seconds()
					#now = datetime.date(exp["end"])
				else:
					if i.has_key("forceDischarge"):
						continue
					else:
						i["forceDischarge"] = 0

				if j[13] != "CurrentEmploymentStartDate":
					tmp = string.split(j[13], "/")
					ces = datetime.date(int(tmp[0]), int(tmp[1]), int(tmp[2]))
					i["CurrentEmploymentStartDate"] = (ces - datetime.date(1970,1,1)).total_seconds()

				print "CSC: ",i["name"],i["forceDischarge"], i["CurrentEmploymentStartDate"]

json1 = json.dumps(resume)
f = open('workfile', 'w')
f.write(json1)


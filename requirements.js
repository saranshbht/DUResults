const fs = require('fs').promises;
const fss = require('fs');
const cheerio = require('cheerio');
const path = require('path');
const zlib = require('zlib');
const axios = require('axios');
const qs = require('qs');
axios.defaults.withCredentials = true;

let headers = {
	'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8',
	'Accept-Encoding': 'gzip, deflate',
	'Accept': '*/*',
	'Connection': 'keep-alive',
	'content-type': 'application/x-www-form-urlencoded'
};

let begin;
let log = (msg = '') => {
    if (!begin) {
        begin = Date.now();
    }
    let t = ((Date.now() - begin) / 1000).toFixed(3);
    console.log(t + ' ' + msg);
    begin = Date.now();
}

let toBeUpdated = () => {
	let remaining = {}
	for (const [key, value] of Object.entries(downloaded)) {
		remaining[key] = value.filter(x => !(updated[key] || []).includes(x));
	}
	return remaining;
}

let getRemaining = (url, type) => {
	return axios(url)
	.then(res => {
		const $ = cheerio.load(res.data);
		let table = $('#gvshow_Reg tr');
		let headers = [];
		table.slice(0, 1).each(function () {
			$('th', this).each(function () {
				headers.push($(this).text());
			})
		});
		let flag_idx = headers.indexOf('Exam Flag');
		let course_idx = headers.indexOf('Course Code');
		let part_idx = headers.indexOf('Part');

		let [ month, year ] = $('#lblexam_session').text().trim().split(" ");
		let start = month == 'May-June' ? 1 : 0;
		let part_yoa = { 'I': '', 'II': '', 'III': '', 'IV': '', 'V': '' };
		for (let key of Object.keys(part_yoa)) {
			part_yoa[key] = String(year - start).slice(-2);
			start++;
		}
		let declared = {}
		table.slice(1).each(function () {
			let flag = $('td', this).eq(flag_idx).text();
			let course = $('td', this).eq(course_idx).text();
			let part = part_yoa[$('td', this).eq(part_idx).text()];
			if (flag.includes('CBCS')) {
				declared[part] = declared[part] || [];
				declared[part].push(course);
			}
		});
		let remaining = {};
		for (const [key, value] of Object.entries(declared)) {
			remaining[key] = value.filter(x => !(downloaded[key] || []).includes(x));
		}
		return remaining;
	})
	.catch(console.log);
}

let setCookie = url => {
	return axios(url)
	.then(res => {
		const $ = cheerio.load(res.data);
		let inputs = $('input');
		let parameters = {};
		inputs.each(function() {
			parameters[$(this).attr('name')] = $(this).attr('value') || '';
		});

		parameters['ddlcollege'] = '015';
		parameters['txtrollno'] = '19015570021';
		parameters['txtcaptcha'] = $('#imgCaptcha').attr('src').split('CaptchaCode=')[1].slice(0, 6);
		parameters['btnsearch'] = 'Print+Score+Card';
		return axios({
			url: url,
			method: 'post',
			data: qs.stringify(parameters),
			headers: headers
		})
		.then(res => {
			const $ = cheerio.load(res.data);
			let cookie = res.headers['set-cookie'][0].split(';')[0];
			console.log(cookie);
			headers['Cookie'] = cookie;
		});
	})
	.catch(console.log);
}


let fetch = (roll, url) => {
	let parameters = {
        'ExamFlag': 'CBCS',
        'ExamType': 'Semester',
        'CollegeCode': '',
        'CourseCode': '',
        'Sem': '',
        'Rollno': ''
    };
    parameters['Rollno'] = roll;
    parameters['CollegeCode'] = roll.slice(2, 5);
    parameters['CourseCode'] = roll.slice(5, 8);
    return axios.get(url, {
    	params: parameters,
    	headers: headers
    })
    .then(res => res.data)
    .catch(err => 'error');
}

let downloadHtmls = async(remaining, type, url, step, store_path) => {
	store_path = path.resolve(store_path, type);

	for (let year of Object.keys(remaining)) {
		// console.log('\nYear', year);
		for (let course of remaining[year]) {
			// console.log('\nCourse', course);
			if (!Object.keys(courses_colleges).includes(course))
				continue;
			
			let issues = 0;
			for (let college of courses_colleges[course]) {
				// console.log('\nCollege', college);
				let dir_path = path.resolve(store_path, year, course, college);
				let j = 1;
				let folder = false;
				while(j + step <= 1000) {
					let count = 0;
					await new Promise(next => {
						let rolls = [];
						for (let i = j; i < j + step; i++) {
							rolls.push(year + college + course + '0'.repeat(3 - String(i).length) + String(i));
						}
						// console.log(rolls);
						Promise.all(rolls.map(roll => fetch(roll, url)))
						.then(responses => {
							responses.map(res => {
								const $ = cheerio.load(res);
								let rollno = $('#lblrollno').text();
								let table = $('#gvshow').text();
								if (rollno && table) {
									if (!folder) {
										fss.mkdirSync(dir_path, { recursive: true });
										folder = true;
									}
									fs.writeFile(path.resolve(dir_path, rollno.slice(-3) + '.html'), res.split('src="../Images').join('src="../../../../Images'))
									.catch(console.log);
								}
								else {
									count++;
								}
							});
							next();
						})
						.catch(console.log);
					});
					if (count == step) {
						if (j == 1) {
							issues++;
							console.log('Error at', year, course, college);
						}
						else {
							console.log(year, course, college);
						}
						break;
					}
					j += step;
				}
			}
			if (!issues) {
				downloaded[year] = downloaded[year] || [];
				if (!(course in downloaded[year]))
					downloaded[year].push(course);
				fs.writeFile(`./downloaded${type}.json`, JSON.stringify(downloaded))
				.catch(console.log);
			}
		}
	}
}


let gradeFun = data => {
	// data -> String/buffer; the html to be parsed
	// returns array having two objects
	// one for semester-wise data; the other for subject-wise data

	const $ = cheerio.load(data);
	let semester = {};
	let subject = {};
	semester['RollNo'] = subject['RollNo'] = $('#lblrollno').text();
	semester['Name'] = subject['Name'] = $('#lblname').text();
	semester['College'] = subject['College'] = $('#lblcollege').text();

	// if college name starts with college code (e.g. (570)), skip code (5 + 1 characters)
	if (semester['College'][0] == '(')
		semester['College'] = subject['College'] = semester['College'].slice(6);
	// process.stdout.write(semester['RollNo'] + ',');

	// get the headings of the table
	let headers = [];
	let sem_table = $('#gv_sgpa tr');
	sem_table.slice(0, 1).each(function () {
		$('th', this).each(function () {
			headers.push($(this).text());
		})
	});
	// console.log(headers);
	let sem_idx = headers.indexOf('Sem');
	let sgpa_idx = headers.indexOf('SGPA');
	let total = 0;
	
	// from 2nd row to last
	sem_table.slice(1).each(function () {
		
		// only select cells having same index as their headings in the header row
		let sem = $('td', this).eq(sem_idx).text();
		let sgpa = $('td', this).eq(sgpa_idx).text();
		semester['Sem' + sem] = sgpa;
		total += parseFloat(sgpa); 
	});
	semester['Average'] = (total / (sem_table.length - 1)).toFixed(3);

	let sub_table = $('#gvshow tr');
	headers = [];
	sub_table.slice(0, 1).each(function () {
		$('th', this).each(function () {
			headers.push($(this).text());
		})
	});

	let paper_idx = headers.indexOf('Paper Name');
	let grade_idx = headers.indexOf('Grade Point');
	sub_table.slice(1).each(function () {
		let paper = $('td', this).eq(paper_idx).text();
		let grade = $('td', this).eq(grade_idx).text();
		subject[paper] = grade;
	});

	return [semester, subject];
}

let marksFun = data => {
	// the marks counterpart of the above defined gradeFun
	// data -> String/buffer; the html to be parsed
	// returns array having two objects
	// one for semester-wise data; the other for subject-wise data


	const $ = cheerio.load(data);
	let semester = {};
	let subject = {};
	semester['RollNo'] = subject['RollNo'] = $('#lblrollno').text();
	semester['Name'] = subject['Name'] = $('#lblname').text();
	semester['College'] = subject['College'] = $('#lblcollege').text();

	// if college name starts with college code (e.g. (570)), skip code (5 + 1 characters)
	if (semester['College'][0] == '(')
		semester['College'] = subject['College'] = semester['College'].slice(6);
	// process.stdout.write(semester['RollNo'] + ',');

	// get the headings of the table
	let headers = [];
	let sem_table = $('#gvrslt tr');
	sem_table.slice(0, 1).each(function () {
		$('th', this).each(function () {
			headers.push($(this).text());
		})
	});

	// console.log(headers);
	let sem_idx = headers.indexOf('Sem');
	let total_idx = headers.indexOf('Total Obtained Marks');
	let max_total_idx = headers.indexOf('Max Total Marks') 
	let total = 0;
	let max_total = 0;

	// from 2nd row to last
	sem_table.slice(1).each(function () {
		
		// only select cells having same index as their headings in the header row
		let sem = $('td', this).eq(sem_idx).text();
		let marks = $('td', this).eq(total_idx).text();
		let max_marks = $('td', this).eq(max_total_idx).text();
		semester['Sem' + sem] = marks + '/' + max_marks;
		total += parseFloat(marks);
		max_total += parseFloat(max_marks); 
	});
	semester['Total'] = total + '/' + max_total;
	semester['Percentage'] = (total * 100 / max_total).toFixed(3);

	let sub_table = $('#gvshow tr');
	headers = [];
	sub_table.slice(0, 1).each(function () {
		$('th', this).each(function () {
			headers.push($(this).text());
		})
	});

	let paper_idx = headers.indexOf('Paper Name');
	sem_idx = headers.indexOf('Sem');
	sub_table.slice(1).each(function () {
		let paper = $('td', this).eq(paper_idx).text();
		let total = 0;
		$('td', this).slice(sem_idx + 1, -1).each(function() {
			// get only the numeric content from the cell
			let val = $(this).text().match(/\d+/);
			if (val)
				total += parseFloat(val[0]);
		});
		subject[paper] = total.toString();
	});

	return [semester, subject];
}

let properConvert = array => {
	let keys = new Set();
	array.map(obj => Object.keys(obj).forEach(keys.add, keys));
	keys = Array.from(keys);
	let data = array.map(values => {
	    return keys.reduce((o, k, i) => {
	        o[i] = values[k] || "";
	        return o;
	    }, []);
	});

	let final_obj = {};
	final_obj['keys'] = keys;
	final_obj['data'] = data;
	return JSON.stringify(final_obj);
}

let makeJsons = (remaining, type, source_path, store_path, zip = false) => {
	// remaining -> Object; years as keys and array of courses as values
	// type -> String; either 'Marks' or 'Grade'
	// source_path -> String; base_dir for htmls
	// store_path -> String; base_dir for storage
	// zip -> boolean; make jsons or json-gzips

	if (zip) {
		store_path += '-zip';
	}
	source_path = path.resolve(source_path, type);
	store_path = path.resolve(store_path, type);

	for (let year of Object.keys(remaining)) {
		// console.log('\nYear', year);
		for (let course of remaining[year]) {
			// console.log('\nCourse', course);
			if (!Object.keys(courses_colleges).includes(course))
				continue;
			
			// accumulators for all colleges
			let all_sub = [];
			let all_sem = [];
			for (let college of courses_colleges[course]) {
				// console.log('\nCollege', college);
				
				// get all files in the folder
				let rolls = fss.readdirSync(path.resolve(source_path, year, course, college));
				
				// accumulators for a single college
				let sub = [];
				let sem = [];
				rolls.map(roll => {
					let filepath = path.resolve(source_path, year, course, college, roll);
					let data = fss.readFileSync(filepath);
					let [semester, subject] = type == 'Marks' ?
						marksFun(data) : gradeFun(data);
					sub.push(subject);
					sem.push(semester);
					
					all_sub.push(subject);
					all_sem.push(semester);
			 	});

				let sub_dir = path.resolve(store_path, 'Subject', year, course);
				let sem_dir = path.resolve(store_path, 'Semester', year, course);
				
				fss.mkdirSync(sub_dir, { recursive: true });
				fss.mkdirSync(sem_dir, { recursive: true });

				let sub_data = properConvert(sub);
				let sem_data = properConvert(sem);

				// gzip data, if json-gzips are to be made
				if (zip) {
					sub_data = zlib.gzipSync(sub_data);
					sem_data = zlib.gzipSync(sem_data);
				}

				fss.writeFileSync(path.resolve(sub_dir, college + '.json' + (zip ? '.gz' : '')), sub_data);
				fss.writeFileSync(path.resolve(sem_dir, college + '.json' + (zip ? '.gz' : '')), sem_data);
				console.log(type, year, course, college);
			}
			
			let all_sub_data = properConvert(all_sub);
			let all_sem_data = properConvert(all_sem);
			if (zip) {
				all_sub_data = zlib.gzipSync(all_sub_data);
				all_sem_data = zlib.gzipSync(all_sem_data);
			}
			fss.writeFileSync(path.resolve(store_path, 'Subject', year, course, 'allColleges.json' + (zip ? '.gz' : '')), all_sub_data);
			fss.writeFileSync(path.resolve(store_path, 'Semester', year, course, 'allColleges.json' + (zip ? '.gz' : '')), all_sem_data);

			// add course to the array of updated courses for current year
			updated[year] = updated[year] || [];
			if (!(course in updated[year]))
				updated[year].push(course);
			fss.writeFileSync(`./updated${type}.json`, JSON.stringify(updated));
		}
	}
}

let jsonsToJsonGzips = (remaining, type, source_path) => {
	let store_path = path.resolve(source_path + '-zip', type);
	source_path = path.resolve(source_path, type);
	
	for (let mode of ['Semester', 'Subject']) {
		for (let year of Object.keys(remaining)) {
			// console.log('\nYear', year);
			for (let course of remaining[year]) {
				// console.log('\nCourse', course);
				if (!Object.keys(courses_colleges).includes(course))
					continue;
				let colleges = fss.readdirSync(path.resolve(source_path, mode, year, course));
				colleges.map(college => {
					// console.log('\nCollege', college);
					let source_file = path.resolve(source_path, mode, year, course, college);
					let store_file = path.resolve(store_path, mode, year, course, college + '.gz');

					let data = fss.readFileSync(source_file);
					fss.writeFileSync(store_file, zlib.gzipSync(data));
				});
			}
		}
	}
}


const courses_colleges = JSON.parse(fss.readFileSync('./coursesColleges.json').toString());

let downloaded = {};
let updated = {};

let loadFiles = type => {
	if (fss.existsSync(`./downloaded${type}.json`)) {
		downloaded = JSON.parse(fss.readFileSync(`./downloaded${type}.json`).toString());
	}
	if (fss.existsSync(`./updated${type}.json`)) {
		updated = JSON.parse(fss.readFileSync(`./updated${type}.json`).toString());
	}
}


module.exports = {
	toBeUpdated,
	getRemaining,
	setCookie,
	downloadHtmls,
	makeJsons,
	loadFiles,
	jsonsToJsonGzips
}
let sorter = (a, b) => {
    let float_a = parseFloat(a);
    let float_b = parseFloat(b);
    if (isNaN(float_a) && isNaN(float_b))
        return a <= b ? -1 : 1;
    if (isNaN(float_a) || isNaN(float_b))
        return a.length <= b.length ? -1 : 1;
    return float_a <= float_b ? -1 : 1;
}

let valueFormatter = (value, type = 'display') => {
    if (type === 'display' || type === 'filter') {
        if (!value || isNaN(value))
            return value;
        return +(Math.round(value + "e+3") + "e-3");
    }
    let val = parseFloat(value);
    return (val ? val : value);
}

let addTooltip = () => {
    let table = $("#table").DataTable();
    let columns = table.settings().init().columns;

    $("#table thead tr th").each(function(index) {
        column = columns[index].title;
        this.setAttribute('data-toggle', 'tooltip');
        this.setAttribute('title', column);
    });
    $('[data-toggle="tooltip"]').tooltip();
    $('[data-toggle="tooltip"]').click(function() {
        $(this).tooltip('hide');
    })
}


let addMinMax = () => {
    let table = $("#table").DataTable();
    // console.log(table.columns());
    let count = -1;
    table.columns().every(function() {
        if (++count > 2) {
            let data = this.data();
            let sorted = data.sort(sorter);
            let maxVal = valueFormatter(sorted[sorted.length - 1]);
            let i = 0;
            while (!sorted[i++]);
            let minVal = valueFormatter(sorted[i - 1]);
            this.nodes().to$().each(function() {
                $(this).removeClass('max min');
                if (valueFormatter(this.innerHTML) === maxVal)
                    $(this).addClass('max');
                else if (valueFormatter(this.innerHTML) === minVal)
                    $(this).addClass('min');
            });
        }
    });
}

let createTable = (keys, objects) => {
    let start = performance.now();
    console.log('creating table');

    let columns = [];
    for (let i = 0; i < keys.length; i++) {
        columns.push({ title: keys[i], name: keys[i], render: valueFormatter });
    }
    let table = $("#table").DataTable({
        data: objects,
        columns: columns,
        deferRender: true,
        initComplete: ( settings, json ) => {
            $('#loadingContainer').remove();
            $('#tableContainer').show();
            $('th').wrapInner('<div class="headerCell" />');
            console.log('loaded');
        },
        dom: 'frtp',
        order: [
            [0, 'asc']
        ],
        pageResize: true
    });
    addTooltip();
    $('#table').wrap('<div class="dataTables_scroll" />');
    console.log(performance.now() - start);
}

let getData = url => {
    return fetch(url)
    .then(res => res.arrayBuffer())
    .then(buffer => {
        console.log('parsing');
        let array = new Uint8Array(buffer);
        let inflated = pako.inflate(array);
        let decoded = new TextDecoder().decode(inflated);
        console.log('done parsing');
        return JSON.parse(decoded);
    });
}

$(window).on('load', function () {
    console.log('window loaded');
    $('.material-icons').css('opacity', '1');
});

//https://raw.githubusercontent.com/saranshbht/DUResults/testing/Marks/Semester/16/570/015.csv
const params = new URL(location.href).searchParams;
const [mode, yoa, college, course, type] = params.values();
const path = [type, mode, yoa, course].join('/');
const file = ['json-zip', path, college + '.json.gz'].join('/');
let baseUrl = "https://raw.githubusercontent.com/saranshbht/DUResults/testing/";

$("select").select2({ theme: "classic", width: "100%" });

let setCollegeList = () => 
fetch(baseUrl + 'codes/collegeCodes.json')
.then(res => res.json())
.then(array => {
    let markup = [];
    array.forEach(({ CollegeCode, CollegeName }, index) => {
        markup.push(`<option value="${CollegeCode}">${CollegeName}</option>`);
    });
    $('#college').html($('#college').html() + markup.join(''));
})
.catch(error => alert(error));

let setCourseList = () => 
fetch(baseUrl + 'codes/courseCodes.json')
.then(res => res.json())
.then(array => {
    let markup = [];
    array.forEach(({ CourseCode, CourseName }, index) => {
        markup.push(`<option value="${CourseCode}">${CourseName}</option>`);
    });
    $('#course').html(markup.join(''));
})
.catch(error => alert(error));

if ($('body').hasClass('index')) {
    setCollegeList();
    setCourseList();
}

let url = "https://raw.githubusercontent.com/saranshbht/Project/testing/032.json.gz";

if ($('body').hasClass('result')) {
    url = baseUrl + file;
    let a = performance.now();
    Promise.all([getData(url), setCollegeList()])
    .then(([array, ]) => {
        let current_college = new URL(location.href).searchParams.get("college");
        if (current_college == "allColleges")
            $("#addCollegeButton").prop('disabled', true);
        else
           $('#college').find('[value=' + current_college + ']').remove();  
        createTable(array['keys'], array['data']); 
        console.log(performance.now() - a);     
    })
    .catch(err => {
        $("#noRecord").modal('show');
        $('#noRecord').on('hidden.bs.modal', function() {
            history.back();
        });
    });
}


$("#addCollegeButton").click(function() {
    let new_college = $("#college").val();
    let newFile = ['json-zip', path, new_college + '.json.gz'].join('/');
    $("#college").find('[value=' + new_college + ']').remove();
    url = baseUrl + newFile;
    getData(url)
    .then(array => {
        let table = $("#table").DataTable();
        let new_keys = array['keys'];

        let old_keys = [];
        let columns = table.settings().init().columns;
        columns.forEach((object, index) => old_keys.push(object.title));

        let keys = Array.from(new Set([...new_keys, ...old_keys]));

        let a = performance.now();
        let old_data = table.rows().data().toArray();
        let old_objects = old_data.map(values => {
            return old_keys.reduce((o, k, i) => {
                o[k] = values[i] || "";
                return o;
            }, {});
        });

        let old_array = old_objects.map(values => {
            return keys.reduce((o, k, i) => {
                o[i] = values[k] || "";
                return o;
            }, []);
        });

        let new_objects = array['data'].map(values => {
            return new_keys.reduce((o, k, i) => {
                o[k] = values[i] || "";
                return o;
            }, {});
        });

        let new_array = new_objects.map(values => {
            return keys.reduce((o, k, i) => {
                o[i] = values[k] || "";
                return o;
            }, []);
        });

        console.log(performance.now() - a);
        table.destroy();
        $("#table").empty();
        createTable(keys, [...old_array, ...new_array]);
        $(".toast").toast({ 'delay': 1000 });
        $(".toast").toast('show');
    })
    .catch(err => {
        $("#noRecord").modal('show');
        // $('#noRecord').on('hidden.bs.modal', function() {
        //     history.back();
        // });
    });
});
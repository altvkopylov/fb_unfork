//Обробка файлу при натисканні на кнопку

// document.querySelector('#test').addEventListener('click', async () => {
//     try {
//         const fileInput = document.getElementById('file');
//         const selectedFile = fileInput.files[0];

//         if (selectedFile) {
//             const selectedRange = await handleFile(selectedFile);
//             console.log(selectedRange);

//             // Тут ви можете використовувати selectedRange для подальших дій
//         } else {
//             console.error("Не вибрано файл");
//         }
//     } catch (error) {
//         console.error("Помилка обробки файлу:", error);
//     }
// });

// Вибір файлу. Прив'язка до кнопки

function chooseFile() {
    document.getElementById('file').click();
}

// Обробка файлу при натисканні кнопки

const fileInput = document.getElementById('file');

fileInput.addEventListener('change', function (event) {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
        processFile(selectedFile);
    }
});

// Отримання вцього діапазону файлу

function handleFile(file) {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.onload = function (e) {
            var data = e.target.result;
            var workbook = XLSX.read(data, { type: 'binary' });
            var sheetNames = workbook.SheetNames; // Отримати список імен аркушів у книзі
            var sheetName = sheetNames[0]; // Взяти перше вкладення
            var sheet = workbook.Sheets[sheetName]; // Взяти його ім'я

            let lastRow = findLastNonEmptyCell(sheet).row;
            let lastColumn = XLSX.utils.encode_col(findLastNonEmptyCell(sheet).column);

            var range = `A1:${lastColumn}${lastRow}`; // Визначте діапазон комірок
            var selectedRange = XLSX.utils.sheet_to_json(sheet, { range: range, header: 1 }); // Отримайте значення з визначеного діапазону

            resolve(selectedRange);
        };
        reader.onerror = function (error) {
            reject(error);
        };
        reader.readAsBinaryString(file);
    });
}

async function processFile(file) {
    try {
        const selectedRange = await handleFile(file);
        console.log(selectedRange);
        console.log(getAllLimitedUser(selectedRange));

        let result = compareArrays(selectedRange, getAllLimitedUser(selectedRange)); 
        console.log(result);
        displayTable(result);
        // Далі виконуйте інші дії з отриманим масивом selectedRange
    } catch (error) {
        console.error("Помилка обробки файлу:", error);
    }
}

// Отримання истанньої колонки та рядка

function findLastNonEmptyCell(sheet) {
    var range = XLSX.utils.decode_range(sheet['!ref']);

    for (var rowNum = range.e.r; rowNum >= range.s.r; rowNum--) {
        for (var colNum = range.e.c; colNum >= range.s.c; colNum--) {
            var cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
            var cell = sheet[cellAddress];

            if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
                // Знайдено непорожню комірку, повертаємо об'єкт з номером рядка і колонки
                return { row: rowNum + 1, column: colNum + 1 };
            }
        }
    }

    return null;
}

// function getAllLimitedUser(data) {
//     let styleIndex = data[0].indexOf('Style');
//     let eventIndex = data[0].indexOf('Event');
//     let marketIndex = data[0].indexOf('Market');
//     let timeIndex = data[0].indexOf('Time');

//     if (styleIndex == -1) {
//         console.error('Некорректний файл');
//     }

//     let array = [];

//     for (let i = 1; i < data.length; i++) {
//         let row = data[i];
//         let styleRow = row[styleIndex];
//         if (styleRow > 0) {
//             array.push({'event': row[eventIndex], 'market': row[marketIndex], 'time': row[timeIndex]});
//         }
//     }

//     return array;
// }

function getAllLimitedUser(data) {
    let styleIndex = data[0].indexOf('Style');
    let eventIndex = data[0].indexOf('Event');
    let marketIndex = data[0].indexOf('Market');
    let timeIndex = data[0].indexOf('Time');

    if (styleIndex === -1 || eventIndex === -1 || marketIndex === -1 || timeIndex === -1) {
        console.error('Некоректний файл');
        return [];
    }

    let uniqueCombinations = {};
    
    for (let i = 1; i < data.length; i++) {
        let row = data[i];
        let styleRow = row[styleIndex];
        
        if (styleRow > 0) {
            let event = row[eventIndex];
            let market = row[marketIndex];
            let time = row[timeIndex];

            let key = `${event}_${market}`;
            
            if (!uniqueCombinations[key]) {
                uniqueCombinations[key] = { event, market, times: [time] };
            } else {
                uniqueCombinations[key].times.push(time);
            }
        }
    }

    // Convert the values of the uniqueCombinations object into an array
    let resultArray = Object.values(uniqueCombinations);

    return resultArray;
}

// function compareArrays(firstArray, secondArray) {
//     // Перевірка на існування times в secondArray
//     if (!Array.isArray(secondArray) || secondArray.length === 0) {
//         console.error('Некоректні дані у другому масиві.');
//         return [];
//     }

//     let matchingRows = [];

//     // Цикл для кожного об'єкта в масиві secondArray
//     for (let j = 0; j < secondArray.length; j++) {
//         let currentSecondArrayData = secondArray[j];

//         // Перевірка на існування times в поточному об'єкті
//         if (!currentSecondArrayData.times || !Array.isArray(currentSecondArrayData.times) || currentSecondArrayData.times.length === 0) {
//             console.error('Некоректні дані у другому масиві.');
//             return [];
//         }

//         // Цикл для кожного рядка в першому масиві
//         for (let i = 0; i < firstArray.length; i++) {
//             let row = firstArray[i];

//             // Фільтрація за співпадінням Event та Market
//             let isMatching = currentSecondArrayData.times.some(time => areTimesClose(row[0], time));
//             if (isMatching && row[3] === currentSecondArrayData.event && row[5] === currentSecondArrayData.market) {
//                 matchingRows.push(row);
//             }
//         }
//     }

//     return matchingRows;
// }

function compareArrays(firstArray, secondArray) {
    // Перевірка на існування times в secondArray
    if (!Array.isArray(secondArray) || secondArray.length === 0) {
        console.error('Некоректні дані у другому масиві.');
        return [];
    }

    let matchingRows = [];

    // Цикл для кожного об'єкта в масиві secondArray
    for (let j = 0; j < secondArray.length; j++) {
        let currentSecondArrayData = secondArray[j];

        // Перевірка на існування times в поточному об'єкті
        if (!currentSecondArrayData.times || !Array.isArray(currentSecondArrayData.times) || currentSecondArrayData.times.length === 0) {
            console.error('Некоректні дані у другому масиві.');
            return [];
        }

        // Цикл для кожного рядка в першому масиві
        for (let i = 0; i < firstArray.length; i++) {
            let row = firstArray[i];

            // Фільтрація за співпадінням Event та Market та колонкою "Style", яка не є числом
            let isMatching = currentSecondArrayData.times.some(time => areTimesClose(row[0], time));
            if (isMatching && row[3] === currentSecondArrayData.event && row[5] === currentSecondArrayData.market && isNaN(row[12])) {
                matchingRows.push(row);
            }
        }
    }

    return matchingRows;
}

// Функція для порівняння часу
function areTimesClose(time1, time2) {
    // Задайте поріг, наприклад, 10 секунд
    const threshold = 20;

    // Переведіть час в секунди та порівняйте їх за порогом
    return Math.abs(time1 * 24 * 60 * 60 - time2 * 24 * 60 * 60) <= threshold;
}

function displayTable(result) {
    // Отримайте таблицю за ідентифікатором
    var table = document.getElementById('resultTable');

    // Додайте дані у тіло таблиці
    for (var j = 0; j < result.length; j++) {
        var row = table.insertRow(j + 1); // +1, щоб уникнути перезапису заголовків
        for (var k = 0; k < result[j].length; k++) {
            var cell = row.insertCell(k);
            cell.innerHTML = result[j][k];
        }
    }
}
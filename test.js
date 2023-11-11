let fs = require('fs'),
    readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

class Node {
    constructor(data) {
        this.data = data;
        this.left = null;
        this.right = null;
    }
}

function createBalancedTree(obj) {
    return _createBalancedTree(obj, 0, Object.keys(obj).length - 1);
}

// сортировка дерева может быть любая какая нужна,
// в данном случае используется сортировка по строковому представлению значения
function sortFunction(a, b){
    var nameA = JSON.stringify(a),
        nameB = JSON.stringify(b);
    if (nameA < nameB)
        return -1;
    if (nameA > nameB)
        return 1;
    return 0;
}

function _createBalancedTree(obj, start, end) {
    let keys = Object.keys(obj);

    if (end < start) {
        return null;
    }

    const mid = Math.floor((start + end) / 2);

    const node = new Node({'key': keys[mid], 'id': obj[keys[mid]]});

    node.left = _createBalancedTree(obj, start, mid - 1);
    node.right = _createBalancedTree(obj, mid + 1, end);

    return node;
}

function getOrderedObjectByKey(source, key) {
    let unordered = {};
    for (let elemKey in source) {
        if (typeof source[elemKey][key] !== undefined) {
            unordered[source[elemKey][key]] = parseInt(source[elemKey]['id']);
        }
    }
    return Object.keys(unordered).sort(sortFunction).reduce(
        (obj, key) => {
            obj[key] = unordered[key];
            return obj;
        },
        {}
    );
}

function getAvailableKeys(source) {
    let availableKeys = [];
    for (let key in source) {
        let tempKeys = Object.keys(source[key]);
        const keys = new Set([
            ...availableKeys,
            ...tempKeys
        ]);
        availableKeys = [...keys];
    }
    return availableKeys;
}

function flatSearchByKeyAndValue(source, key, value) {
    let result = {
        count: 0,
        found: false
    }
    for (let elemKey in source) {
        result.count++;
        if (
            typeof source[elemKey][key] !== undefined
            && source[elemKey][key] === value
        ) {
            result.found = parseInt(source[elemKey].id);
            return result;
        }
    }
    // возвращаем результат, если ничего не нашли
    return result;
}

function indexSearchByValue(currentNode, value, result = {
    count: 0,
    found: false
}) {
    result.count++;
    if (currentNode.data.key === value) {
        result.found = currentNode.data.id;
    } else {
        if (currentNode.left instanceof Node) {
            return indexSearchByValue(currentNode.left, value, result);
        }
        if (currentNode.right instanceof Node) {
            return indexSearchByValue(currentNode.right, value, result);
        }
    }
    return result;
}

let source = JSON.parse(fs.readFileSync('./source.json', { encoding: 'utf8' }));

// берем все доступные для индексации ключи
let availableKeys = getAvailableKeys(source);

console.log('Available keys for indexing', availableKeys);

rl.question("Please enter key for creating index? ", function (key) {
    if (availableKeys.indexOf(key) === -1) {
        console.log('Sorry, that key does not exist in source (');
        process.exit();
    }

    console.log(`Using "${key}" for creating index`);

    // берем отсортированный массив по нужному ключу
    let orderedValues = getOrderedObjectByKey(source, key);

    console.log('Available values for indexing', Object.keys(orderedValues));

    // создаём балансированное дерево
    let tree = createBalancedTree(orderedValues);

    // записываем индекс в файл
    fs.writeFileSync("index.json", JSON.stringify(tree));

    rl.question("Please enter value for searching? ", function (value) {

        let flatSearchResult = flatSearchByKeyAndValue(source, key, value);

        console.log('Flat search result: ' + (flatSearchResult.found === false ? 'Not found' : 'Found') + ' in '
            + flatSearchResult.count + ' iterations');

        let indexSearchResult = indexSearchByValue(tree, value);

        console.log('Index search result: ' + (indexSearchResult.found === false ? 'Not found' : 'Found') + ' in '
            + indexSearchResult.count + ' iterations');

        process.exit();

    });

});

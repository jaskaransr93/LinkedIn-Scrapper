

// An object to store all the info related to a concordance

var dict = {};
var keys = [];

// Splitting up the text
const split = (text) => {
    // Split into array of tokens
    return text.split(/\W+/);
}

// A function to validate a toke
const validate = (token) => {
    return /\w{2,}/.test(token);
}

// Process new text
const process = (data) => {
    var tokens;
    // Is it already split?
    // if (data instanceof Array) {
    //     tokens = data;
    // } else {
        tokens = split(data);
    // }

    // For every token
    for (var i = 0; i < tokens.length; i++) {
        // Lowercase everything to ignore case
        var token = tokens[i].toLowerCase();
        // if (validate(token)) {
            // Increase the count for the token
            increment(token);
        // }
    }
}

// An array of keys
const getKeys = () => {
    return keys;
}

// Get the count for a word
const getCount = (word) => {
    return dict[word];
}

// Increment the count for a word
const increment = (word) => {
    // Is this a new word?
    if (!dict[word]) {
        dict[word] = 1;
        keys.push(word);
        // Otherwise just increment its count
    } else {
        dict[word]++;
    }
}

// Sort array of keys by counts
const sortByCount = () => {
    // For this function to work for sorting, I have
    // to store a reference to this so the context is not lost!
    var concordance = this;

    // A fancy way to sort each element
    // Compare the counts
    function sorter(a, b) {
        var diff = concordance.getCount(b) - concordance.getCount(a);
        return diff;
    }

    // Sort using the function above!
    keys.sort(sorter);
}

const getDict = () => {
    return dict;
};

module.exports = {
    split: split,
    validate: validate,
    process: process,
    getKeys: getKeys,
    getCount: getCount,
    sortByCount: sortByCount,
    getDict: getDict
}

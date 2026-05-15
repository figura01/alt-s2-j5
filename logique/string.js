//Créez une fonction qui prend une chaîne de caractères en paramètre et retourne sa longueur après avoir supprimé tous les espaces.
function getLengthWithoutSpaces(str) {
    return str.trim().length;
}

// Développez une fonction qui accepte un prénom en paramètre et renvoie une salutation personnalisée en mettant la première lettre en majuscule.
function getGreeting(name) {
    name = name.trim();
    return "Bonjour, " + name.charAt(0).toUpperCase() + name.slice(1) + " !";
}

// Écrivez une fonction qui détermine si une chaîne de caractères se termine par un point d'exclamation.
function endsWithExclamation(str) {
    return str.endsWith('!');
}

// Écrivez une fonction qui compte le nombre d'occurrences d'une lettre dans une chaîne de caractères.
function countLetter(str, letter) {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
        if (str.charAt(i) === letter) {
            count++;
        }
    }
    return count;
}

// Écrivez une fonction qui convertit une chaîne en "camelCase"
function toCamelCase(str) {
    str = str.trim();
    if (str === "") {
        return str;
    }
    let words = str.split(" ");
    for (let i = 1; i < words.length; i++) {
        words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }
    return words.join("");
}

// Écrivez une fonction qui compte le nombre de voyelles dans une chaîne
function countVowels(str) {
    const vowels = "aeiouyAEIOUY";
    let count = 0;
    for (let i = 0; i < str.length; i++) {
        if (vowels.includes(str.charAt(i))) {
            count++;
        }
    }
    return count;
}

// Écrivez une fonction qui alterne majuscules et minuscules dans une chaîne
function alternateCase(str) {
    let result = "";
    for (let i = 0; i < str.length; i++) {
        if (i % 2 === 0) {
            result += str.charAt(i).toUpperCase();
        } else {
            result += str.charAt(i).toLowerCase();
        }
    }
    return result;
}

// Écrivez une fonction qui supprime les caractères en double consécutifs dans une chaîne
function removeConsecutiveDuplicates(str) {
    let result = "";
    for (let i = 0; i < str.length; i++) {
        if (i === 0 || str.charAt(i) !== str.charAt(i - 1)) {
            result += str.charAt(i);
        }
    }
    return result;
}

// Écrivez une fonction qui extrait les initiales d'un nom complet
function getInitials(name) {
    name = name.trim();
    let words = name.split(" ");
    let initials = "";
    for (let i = 0; i < words.length; i++) {
        initials += words[i].charAt(0).toUpperCase();
    }
    return initials;
}

// Écrivez une fonction qui masque les caractères d'une chaîne sauf les N derniers
function maskString(str, n) {
    if (n >= str.length) {
        return "*".repeat(str.length);
    }
    return "*".repeat(str.length - n) + str.slice(-n);
}

// Écrivez une fonction qui vérifie si une chaîne est un palindrome
function isPalindrome(str) {
    str = str.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    let reversed = str.split("").reverse().join("");
    return str === reversed;
}


// Écrivez une fonction qui trouve la plus longue séquence de caractères identiques dans une chaîne
function longestIdenticalSequence(str) {
    let maxLength = 0;
    let currentLength = 1;
    for (let i = 1; i < str.length; i++) {
        if (str.charAt(i) === str.charAt(i - 1)) {
            currentLength++;
        } else {
            maxLength = Math.max(maxLength, currentLength);
            currentLength = 1;
        }
    }
    return Math.max(maxLength, currentLength);
} 

// Écrivez une fonction qui formate un texte en ajoutant des points de suspension
function addEllipsis(str, maxLength) {
    if(!maxLength || maxLength <= 0) {
        return str+"...";
    }
    if (str.length > maxLength) {
        return str.slice(0, maxLength) + "...";
    }
    return str;
}

// Écrivez une fonction qui capitalise la première lettre de chaque mot dans une chaîne
function capitalizeWords(str) {
    let words = str.trim().split(" ");
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }
    return words.join(" ");
}
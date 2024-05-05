const form = document.querySelector("form");
const btnDownload = document.querySelector("#btnDownload");
const bodyTable = document.querySelector("#amortization tbody");

const divResult = document.querySelector("#amortization");
const errorMessage = document.querySelector("#errorMessage");
const inputs = document.querySelectorAll("input");
let nodeToErase = ""; //stock les templates clonner et inséré dans le DOM

form.addEventListener("submit", (e) => { // écouteur d'évênement soumission du formulaire

    let amount = "";
    let rate = "";
    let duration = "";

    e.preventDefault(); //l'action par défault ne sera pas exécutée, l'évènement doit êtr géré explicitement

    eraseResult(nodeToErase); //appel la fonction qui efface les templates précédemment clonés et inséré ds le DOM

    displayError();   //un ou plusieurs champs ne sont pas correct

    if (form.checkValidity()) { //formulaire valide
        //récupération des données pour le calcul
        amount = document.querySelector("#amount").value;
        rate = document.querySelector("#rate").value;
        duration = document.querySelector("#duration").value;

        calculAmortization(amount, rate, duration); //appel de la fonction de calcul
    }

});

function displayError() {
    let champs = "";
    divResult.style.display = "none"; //cache la div résultat si elle a été précédemment affichée
    inputs.forEach((input) => { //boucle sur les champs
        if (!input.checkValidity()) { //champ non valid
            input.classList.add("onError"); //ajout de la classe erreur qui permet de display en rouge
            champs += input.name.toString() + ", ";
        } else {
            input.classList.remove("onError");//retrait de la classe si le champ redevient valide
        }
    });
    errorMessage.innerHTML = `Veuillez remplir les champs: ${champs} avec données valides !`;
    errorMessage.classList.remove("itemHidden"); //rendre visible le message d'erreur
}

function calculAmortization(amount, rate, duration) {
    const decimalMonthRate = (rate / 12) / 100; //taux d'intérêt mensuel en décimale
    const numberOfPayments = duration * 12; // durée en mois
    //calcul de l'échéance mensuel
    let EMI = Math.round(amount * ((decimalMonthRate * ((1 + decimalMonthRate) ** numberOfPayments)) / (((1 + decimalMonthRate) ** numberOfPayments) - 1)));
    
    if(EMI < 10){
        errorMessage.innerHTML = `L'échéance mensuelle est inférieure à 10 euro.<br>Veuillez saisir de nouvelles données !`;
        errorMessage.classList.remove("itemHidden"); //rendre visible le message d'erreur
        return;
    }

    let month = 1;
    let initialAmount = Math.round(amount);
    let interest = 0;
    let amortization = 0;
    let finalAmount = 0;

    //vérifier que le browser supporte la balise template en cherchant la presence
    if ("content" in document.createElement("template")) {

        do { //boucle tant que la somme à remboursée est supérieur à 0

            interest = Math.round(initialAmount * decimalMonthRate); //calcul des intérêts
            amortization = Math.round(EMI - interest); //calcul de l'amortissement
            if (EMI >= initialAmount || month === numberOfPayments) { //dernière ligne d'amortissement
                finalAmount = 0;
                EMI = initialAmount + interest;
                amortization = Math.round(EMI - interest); //calcul de l'amortissement
            }

            finalAmount = Math.round(initialAmount - amortization);

            createTemplateResult([month, initialAmount, EMI, interest, amortization, finalAmount]);

            month++;
            initialAmount = finalAmount;

        } while (finalAmount > 0)
    }

    displayResult();
}

function createTemplateResult(values) { //gestion de la copie du template et de son insertion dans le DOM
    const template = document.querySelector("#tableRow");

    const newLigne = template.content.cloneNode(true); //clone du modèle de la ligne
    // Mettre à jour les élements de la ligne
    const itemsNewLigne = newLigne.querySelectorAll("td");
    itemsNewLigne[0].textContent = values[0];
    itemsNewLigne[1].textContent = values[1] + " €";
    itemsNewLigne[2].textContent = values[2] + " €";
    itemsNewLigne[3].textContent = values[3] + " €";
    itemsNewLigne[4].textContent = values[4] + " €";
    itemsNewLigne[5].textContent = values[5] + " €";

    bodyTable.appendChild(newLigne);
    nodeToErase = bodyTable.childNodes; //stock les nouveaux noeuds
}

function displayResult() { //gestion de l'affichage
    inputs.forEach((input) => { //boucle sur les champs
        input.classList.remove("onError");//retrait de la classe si le champ redevient valide
    });
    errorMessage.classList.add("itemHidden"); //cache le message d'erreur si précédemment affiché
    divResult.style.display = "flex"; //rend visible la div
}

function eraseResult(nodes) { //efface les templates cloner et insérés dans le DOM
    if (nodes.length > 1) {
        for (let i = nodes.length - 1; i > 1; i--) {
            bodyTable.removeChild(nodes[i]);
        }
    }
}

btnDownload.addEventListener("click", function () { //écouteur d'evênement clic sur le bouton de téléchargement

    const { jsPDF } = window.jspdf; // Importation de jsPDF pour créer un PDF
    // Récupération des éléments HTML nécessaires
    const pdfContent = document.querySelector("#pdfContent");
    const amortizationTable = document.querySelector("#amortization");
    const doc = new jsPDF("p", "mm", "a4"); // Créez une instance de jsPDF

    const titleFontSize = 14; // Taille de police titre
    const fontSize = 10; // Taille de police
    const lineHeight = 0.8; // Hauteur de ligne
    pdfContent.style.width = "1200px"; //mettre le contenu de l'image en mode "non responsive"

    doc.html(pdfContent, { 
        html2canvas: { scale: 0.14 }, // Configuration pour la conversion HTML en image (scale = échelle)
        callback: function (doc) {
            // Ajoutez le logo en haut de chaque page
            doc.addImage("./logo_microlead.png", "PNG", (210-30)/2, 10, 30, 10);

            const tableText = amortizationTable.innerText; // Récupération du texte du tableau d'amortissement
            const lines = tableText.split('\n'); // Séparation du texte en lignes

            let y = 110; // Position verticale initiale
            let linesPerPage = 22; // Nombre de lignes par page pour la première page
            let isFirstPage = true;

            for (let i = 0; i < lines.length - 1; i++) { // Parcours des lignes du texte
                let x = i < 1 ? 70 : 20 ; // Détermine la position horizontale initiale pour le texte
                if (!isFirstPage && (i - 22) % linesPerPage === 0) {
                    doc.addPage(); // Ajout d'une nouvelle page
                    // Réaffichage du logo en haut de la nouvelle page
                    doc.addImage("./logo_microlead.png", "PNG", (210-30)/2, 10, 30, 10); 
                    y = 40; // Réinitialisez la position verticale pour la nouvelle page
                    linesPerPage = 30; // Nombre de lignes par page pour les pages suivantes
                }

                doc.setFontSize(i < 1 ? titleFontSize : fontSize); // Appliquez une taille de police différente
                doc.setTextColor(35, 75, 104); //appliquez la couleur 
                // Divise la ligne de texte en colonnes (séparées par des tabulations)
                const lineText = lines[i].split('\t');
                for (let j = 0; j < lineText.length; j++) { // Parcours des colonnes et affichage du texte
                    doc.text(x, y, lineText[j]);
                    x += 30; // Réglez cette valeur pour définir l'espacement horizontal entre les colonnes
                }
                y += fontSize * lineHeight; // Augmentation de la position verticale
                isFirstPage = false; 
            }
            doc.save("calcul_amortissement.pdf"); // Enregistre le PDF sous un nom de fichier
        },
        x: 20, // Position horizontale de départ
        y: 30,  // Position verticale de départ
    });

});



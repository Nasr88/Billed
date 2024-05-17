/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom/extend-expect';

import { getByRole, screen, waitFor, within } from "@testing-library/dom";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockedStore from "../__mocks__/store";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

jest.mock("../app/store", () => mockedStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
 // Définir le type d'utilisateur comme 'Employee' dans localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      // Simuler le rendu de l'application et la navigation vers la page des factures
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()// Initialise le routage de l'application
      window.onNavigate(ROUTES_PATH.Bills)// Simule la navigation vers la page des factures
  
      // Attendre que l'icône de facture soit chargée//
      await waitFor(() => screen.getByTestId('icon-window'))
       
       // Vérifier si l'icône de facture est rendue sur la page des factures
       const windowIcon = screen.getByTestId('icon-window');
       // Vérifier si l'icône de facture est en surbrillance en vérifiant la classe CSS
        expect(windowIcon).toHaveClass('active-icon'); // Vérifie la présence de la classe CSS active-icon
  })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    /*********************************************************************/ 
    /*********************************************************************/ 
    /*********************************************************************/ 

    test("Then clicking on 'New Bill' button should navigate to the NewBill page", () => {
      // simuler le localStorage du navigateur pour les besoins du test
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      // simuler la présence d'un utilisateur connecté dans l'application
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));
  
      // préparer le DOM 
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.appendChild(root);
  
      router();
      // Simuler la navigation vers la page Bills
      window.onNavigate(ROUTES_PATH.Bills);
      
      // screen.getByRole: testing library , screen fait reference au document entier
      const buttonNewBill = screen.getByRole("button", {
        name: /nouvelle note de frais/i,
      });
      //simuler un clic sur le bouton
      buttonNewBill.dispatchEvent(new MouseEvent('click'));
  
      const newBillUrl = window.location.href.replace(/^https?:\/\/localhost\//, '');
      expect(newBillUrl).toBe('#employee/bill/new');
    });


    test("Then all bills are displayed", () => {
      // simuler le rendu de l'interface utilisateur des factures dans le DOM
      document.body.innerHTML = BillsUI({ data: bills });

      const iconEye = screen.getAllByTestId("icon-eye");
      const allBills = screen.getAllByTestId("bill");

      expect(allBills.length).toBe(4);
      expect(iconEye.length).toBe(4);
    });

  })

  });
  ////////////////////////////////////
  describe("When I click on one eye icon", () => {
    test("Then a modal should open", async () => {

      // Définir une fonction onNavigate qui met à jour le contenu de document.body en fonction du chemin fourni
      const onNavigate = pathname => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Mocke l'objet localStorage du navigateur pour le test
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      
      // simuler la présence d'un utilisateur connecté dans l'application
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      // Crée une instance de la classe Bills avec les dépendances nécessaires
      const billsPage = new Bills({
        document,
        onNavigate,
        store: mockedStore,
        localStorage: window.localStorage,
      });

      // Rendu de l'interface utilisateur des factures dans le DOM en utilisant la fonction BillsUI avec les données des factures.
      document.body.innerHTML = BillsUI({ data: bills });
      // Sélectionne tous les éléments du DOM ayant l'attribut data-testid="icon-eye"
      const iconEyes = screen.getAllByTestId("icon-eye");
      // Mocke la fonction handleClickIconEye de la page des factures pour vérifier qu'elle est appelée
      const handleClickIconEye = jest.fn(billsPage.handleClickIconEye);
      // Sélectionne l'élément du DOM représentant la modale
      const modale = document.getElementById("modaleFile");
      // Mocke la méthode modal de jQuery pour ajouter la classe "show" à la modale, simulant son ouverture
      $.fn.modal = jest.fn(() => modale.classList.add("show")); 

      iconEyes.forEach(iconEye => {
        iconEye.addEventListener("click", () => handleClickIconEye(iconEye));
        userEvent.click(iconEye);//Simule un clic sur l'icône "œil" en utilisant userEvent.click

        expect(handleClickIconEye).toHaveBeenCalled();//Vérifie que la fonction handleClickIconEye a été appelée

        expect(modale).toHaveClass("show");//Vérifie que la modale est visible
      });
    });
  });

  describe("When I went on Bills page and it is loading", () => {
    test("Then, Loading page should be rendered", () => {
      // Rendu de l'interface utilisateur des factures dans le DOM avec l'état de chargement activé
      document.body.innerHTML = BillsUI({ loading: true });
      // Vérifie que l'élément contenant le texte "Loading..." est visible à l'écran
      expect(screen.getByText("Loading...")).toBeVisible();
       // Réinitialise le contenu de `document.body` après le test
      document.body.innerHTML = "";
    });
  });

  describe("When I am on Bills page but back-end send an error message", () => {
    test("Then, Error page should be rendered", () => {
      // Injecte dans le DOM une représentation de l'interface utilisateur des factures avec un état d'erreur
      document.body.innerHTML = BillsUI({ error: "error message" });
       // Vérifie que l'élément contenant le texte "Erreur" est visible à l'écran
      expect(screen.getByText("Erreur")).toBeVisible();
      // Réinitialise le contenu de `document.body` après le test
      document.body.innerHTML = "";
    });
  });

  
  describe("When I navigate to Bills Page", () => {
    test("fetches bills from mock API GET", async () => {

      // Espionne la méthode bills du store mocké pour vérifier si elle est appelée.
      jest.spyOn(mockedStore, "bills");

      // Simule la présence d'un utilisateur connecté en tant qu'employé dans l'application.
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      
      // Attend que le contenu "Mes notes de frais" soit rendu sur la page des factures.
      await waitFor(() => screen.getByText("Mes notes de frais"));

      const newBillBtn = await screen.findByRole("button", {
        name: /nouvelle note de frais/i,
      });
      const billsTableRows = screen.getByTestId("tbody");

      expect(mockedStore.bills).toHaveBeenCalled(); 
      expect(newBillBtn).toBeTruthy();//Vérifie que le bouton "Nouvelle note de frais" est présent sur la page
      expect(billsTableRows).toBeTruthy();//Vérifie que le tableau des factures est présent sur la page
      expect(within(billsTableRows).getAllByRole("row")).toHaveLength(4);//Vérifie que le nombre de lignes dans le tableau correspond au nombre attendu de factures 
    });

    test("fetches bills from an API and fails with 404 message error", async () => {
      mockedStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockedStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });

  


  
    
	
  
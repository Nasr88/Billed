/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom/extend-expect';

import { screen, waitFor, within } from "@testing-library/dom";
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

    test("Then clicking on 'New Bill' button should navigate to the NewBill page", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));
  
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.appendChild(root);
  
      router();
      window.onNavigate(ROUTES_PATH.Bills);
  
      const buttonNewBill = screen.getByRole("button", {
        name: /nouvelle note de frais/i,
      });
      buttonNewBill.dispatchEvent(new MouseEvent('click'));
  
      const newBillUrl = window.location.href.replace(/^https?:\/\/localhost\//, '');
      expect(newBillUrl).toBe('#employee/bill/new');
    });


    test("Then all bills are displayed", () => {
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
      const onNavigate = pathname => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });

      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const billsPage = new Bills({
        document,
        onNavigate,
        store: mockedStore,
        localStorage: window.localStorage,
      });

      document.body.innerHTML = BillsUI({ data: bills });

      const iconEyes = screen.getAllByTestId("icon-eye");

      const handleClickIconEye = jest.fn(billsPage.handleClickIconEye);

      const modale = document.getElementById("modaleFile");

      $.fn.modal = jest.fn(() => modale.classList.add("show")); //mock de la modale Bootstrap

      iconEyes.forEach(iconEye => {
        iconEye.addEventListener("click", () => handleClickIconEye(iconEye));
        userEvent.click(iconEye);

        expect(handleClickIconEye).toHaveBeenCalled();

        expect(modale).toHaveClass("show");
      });
    });
  });

  describe("When I went on Bills page and it is loading", () => {
    test("Then, Loading page should be rendered", () => {
      document.body.innerHTML = BillsUI({ loading: true });
      expect(screen.getByText("Loading...")).toBeVisible();
      document.body.innerHTML = "";
    });
  });

  describe("When I am on Bills page but back-end send an error message", () => {
    test("Then, Error page should be rendered", () => {
      document.body.innerHTML = BillsUI({ error: "error message" });
      expect(screen.getByText("Erreur")).toBeVisible();
      document.body.innerHTML = "";
    });
  });

  //TODO 6 test d'intégration GET
  describe("When I navigate to Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      jest.spyOn(mockedStore, "bills");
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

      await waitFor(() => screen.getByText("Mes notes de frais"));

      const newBillBtn = await screen.findByRole("button", {
        name: /nouvelle note de frais/i,
      });
      const billsTableRows = screen.getByTestId("tbody");

      expect(newBillBtn).toBeTruthy();
      expect(billsTableRows).toBeTruthy();
      expect(within(billsTableRows).getAllByRole("row")).toHaveLength(4);
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

  


  
    
	
  
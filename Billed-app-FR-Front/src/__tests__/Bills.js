/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import '@testing-library/jest-dom/extend-expect';

import router from "../app/Router.js";

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
  })
})

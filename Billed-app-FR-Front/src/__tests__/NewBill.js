/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, fireEvent, getByTestId, waitFor } from "@testing-library/dom";
import mockStore from "../__mocks__/store.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);

describe("When I am on NewBill Page", () => {
  beforeEach(() => {

    // Configure le localStorage pour simuler un utilisateur de type "Employee"
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );

    // Crée un élément div avec l'id "root" et initialise le routeur
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
  });

  test("Then mail icon on vertical layout should be highlighted", async () => {

    window.onNavigate(ROUTES_PATH.NewBill);//Navigue vers la page NewBill
    await waitFor(() => screen.getByTestId("icon-mail"));//Attend que l'icône du mail soit présente dans le DOM
    const Icon = screen.getByTestId("icon-mail");
    expect(Icon).toHaveClass("active-icon"); //Vérifie que l'icône a la classe "active-icon"
  });

  describe ("When I am on NewBill form", () => {
    test("Then I add File", async () => {
      // Initialise la page NewBill avec des dépendances
      const dashboard = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: localStorageMock,
      });
  
      // Simule l'ajout d'un fichier via un événement change sur l'élément input de type "file"
      const handleChangeFile = jest.fn(dashboard.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(["document.jpg"], "document.jpg", {
              type: "document/jpg",
            }),
          ],
        },
      });
  
      expect(handleChangeFile).toHaveBeenCalled();//Vérifie que la fonction handleChangeFile a été appelée au moins une fois
      expect(handleChangeFile).toBeCalled();//Vérifie que la fonction handleChangeFile a été appelée un nombre spécifique de fois
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();//Vérifie la présence du texte "Envoyer une note de frais"
    });
  })
});

/* Api */
describe("When I am on NewBill Page and submit the form", () => {
  beforeEach(() => {
    // Configure le localStorage pour simuler un utilisateur de type "Employee" avec un email
    jest.spyOn(mockStore, "bills");
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );
    // Crée un élément div avec l'id "root" et initialise le routeur 
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    router();
  });

  describe("user submit form valid", () => {
    test("call api update bills", async () => {

      // Initialise la page NewBill avec des dépendances
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localeStorage: localStorageMock,
      });

       // Mock la fonction handleSubmit de NewBill
      const handleSubmit = jest.fn(newBill.handleSubmit);

      // Sélectionne le formulaire de la nouvelle note de frais
      const form = screen.getByTestId("form-new-bill");

       // Ajoute un écouteur d'événement de soumission au formulaire
      form.addEventListener("submit", handleSubmit);

      // Déclenche l'événement de soumission du formulaire
      fireEvent.submit(form);

      // Vérifie que l'API "bills" a été appelée
      expect(mockStore.bills).toHaveBeenCalled();
    });
  });
});

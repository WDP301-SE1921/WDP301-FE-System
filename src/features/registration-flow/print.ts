export function printRegistrationDocument(documentType: "bill" | "receipt") {
  document.body.dataset.registrationPrint = documentType;
  try {
    window.print();
  } finally {
    delete document.body.dataset.registrationPrint;
  }
}

export default function printPage(target) {
  const resetPrintTarget = () => {
    delete document.body.dataset.printTarget;
  };

  window.addEventListener('afterprint', resetPrintTarget, { once: true });
  document.body.dataset.printTarget = target;
  window.print();
}

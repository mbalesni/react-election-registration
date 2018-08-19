export const QUAGGA_OPTIONS = {
    numOfWorkers: getCoresNumber(),
    inputStream : {name : "Live",type : "LiveStream"},
    decoder : {readers : ["code_128_reader"]},
    frequency: 10
}

function getCoresNumber() {
  try {
    let cores = navigator.hardwareConcurrency
    return cores
  } catch (err) {
    console.error(err)
    return 2
  }
}

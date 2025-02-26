export const fields = {
  name: {
    type: 'string',
    required: true,
  },
  position: {
    type: 'string',
  },
  lokasi: {
    type: 'async',  // Menggunakan SelectAsync
    required: true,
    entity: 'lokasi', // Nama entity dari backend
    displayLabels: ['name'], // Label yang akan ditampilkan di dropdown
    outputValue: 'id', // Value yang akan dikirim saat form disubmit
    loadDefault: true, 
  },
  shift: {
    type: 'async',  // Menggunakan SelectAsync
    required: true,
    entity: 'shifts', // Nama entity dari backend
    displayLabels: ['name'], // Label yang akan ditampilkan di dropdown
    outputValue: 'id', // Value yang akan dikirim saat form disubmit
    loadDefault: true, 
  },
};
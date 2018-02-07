// Possible fields
//
// { IstSchreibbar: 'true',
//   AnlageId: 'xxx',
//   GeraetId: 'xxx',
//   DatenpunktId: '51',
//   DatenpunktName: 'konf_ww_solltemp_rw',
//   DatenpunktTyp: 'Integer',
//   DatenpunktTypWert: '0',
//   MinimalWert: '10.00',
//   MaximalWert: '95.00',
//   EinheitBezeichnung: 'ecnUnit.Grad C',
//   DatenpunktGruppe: 'HC1',
//   HeizkreisId: '18992',
//   Auslieferungswert: '50',
//   IstLesbar: 'true',
//   Wert: '50',
//   Zeitstempel: '2030-01-03 22:13:00',
//   DatenpunktStatus: '0' }

module.exports = {
  email   : 'max@mustermann.de',
  password: 'max123###',
  systemId: '123456',
  deviceId: '123456',
  fields  : [
    'DatenpunktId',
    'DatenpunktTyp',
    'DatenpunktName',
    'MinimalWert',
    'Wert',
    'MaximalWert',
    'EinheitBezeichnung',
    'IstSchreibbar',
    'DatenpunktGruppe',
    'Auslieferungswert'
  ]
};

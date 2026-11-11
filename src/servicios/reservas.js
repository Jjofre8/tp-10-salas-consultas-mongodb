const mongoose = require("mongoose");
const Reserva = require("../modelos/reserva");

const salasPermitidas = ["Sala Norte", "Sala Sur", "Sala Multimedia"];

const turnosPermitidos = ["Mañana", "Tarde", "Noche"];

function convertirReserva(documento) {
  return {
    id: documento._id.toString(),
    estudiante: documento.estudiante,
    email: documento.email,
    sala: documento.sala,
    fecha: documento.fecha,
    turno: documento.turno,
    personas: documento.personas,
    estado: documento.estado,
  };
}

function validarId(id) {
  if (!mongoose.isObjectIdOrHexString(id)) {
    const error = new Error("El identificador de la reserva no es válido.");
    error.status = 400;
    throw error;
  }
}

function crearServicioReservas() {
  async function listar(sala) {
    const criterio = {};

    if (sala !== undefined) {
      criterio.sala = sala;
    }

    const reservas = await Reserva.find(criterio).lean();

    return reservas.map(convertirReserva);
  }

  async function consultar({
    sala,
    orden = "estudiante",
    pagina = 1,
    limite = 2,
  } = {}) {
    const filtro = {};

    if (sala !== undefined) {
      filtro.sala = sala.trim();
    }

    let criterioOrden = { estudiante: 1, _id: 1 };

    if (orden === "personas-asc") {
      criterioOrden = { personas: 1, _id: 1 };
    }

    if (orden === "personas-desc") {
      criterioOrden = { personas: -1, _id: 1 };
    }

    const salto = (pagina - 1) * limite;

    const total = await Reserva.countDocuments(filtro);

    const reservas = await Reserva.find(filtro)
      .select("estudiante email sala fecha turno personas estado")
      .sort(criterioOrden)
      .skip(salto)
      .limit(limite)
      .lean();

    return {
      datos: reservas.map(convertirReserva),
      pagina,
      limite,
      total,
      paginas: Math.ceil(total / limite),
    };
  }

  async function buscarPorId(id) {
    validarId(id);

    const reserva = await Reserva.findById(id).lean();

    return reserva ? convertirReserva(reserva) : null;
  }

  async function contar() {
    return Reserva.countDocuments({});
  }

  async function crear(datos) {
    const nuevaReserva = new Reserva({
      estudiante: datos.estudiante,
      email: datos.email,
      sala: datos.sala,
      fecha: datos.fecha,
      turno: datos.turno,
      personas: datos.personas,
    });

    const reservaGuardada = await nuevaReserva.save();

    return convertirReserva(reservaGuardada.toObject());
  }

  async function reemplazar(id, datos) {
    validarId(id);

    const reemplazo = {
      estudiante: datos.estudiante,
      email: datos.email,
      sala: datos.sala,
      fecha: datos.fecha,
      turno: datos.turno,
      personas: datos.personas,
      estado: datos.estado,
    };

    const reserva = await Reserva.findOneAndReplace({ _id: id }, reemplazo, {
      returnDocument: "after",
      runValidators: true,
      upsert: false,
    }).lean();

    return reserva ? convertirReserva(reserva) : null;
  }

  async function modificarParcialmente(id, datos) {
    validarId(id);

    const cambios = {};

    if (Object.prototype.hasOwnProperty.call(datos, "personas")) {
      cambios.personas = datos.personas;
    }

    if (Object.prototype.hasOwnProperty.call(datos, "estado")) {
      cambios.estado = datos.estado;
    }

    const reserva = await Reserva.findOneAndUpdate(
      { _id: id },
      { $set: cambios },
      {
        returnDocument: "after",
        runValidators: true,
        upsert: false,
      }
    ).lean();

    return reserva ? convertirReserva(reserva) : null;
  }

  async function eliminar(id) {
    validarId(id);

    const reserva = await Reserva.findByIdAndDelete(id);

    return reserva !== null;
  }

  function obtenerSalasPermitidas() {
    return salasPermitidas;
  }

  function obtenerTurnosPermitidos() {
    return turnosPermitidos;
  }

  return {
    listar,
    consultar,
    buscarPorId,
    contar,
    crear,
    reemplazar,
    modificarParcialmente,
    eliminar,
    obtenerSalasPermitidas,
    obtenerTurnosPermitidos,
  };
}

module.exports = crearServicioReservas;

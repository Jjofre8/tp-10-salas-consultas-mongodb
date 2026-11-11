const { URL } = require("node:url");

function crearControladorReservasApi(servicio) {
  async function listar(req, res) {
    const url = new URL(req.originalUrl, "http://localhost");
    const parametros = url.searchParams;

    const permitidos = ["sala", "orden", "pagina", "limite"];

    for (const nombre of parametros.keys()) {
      if (!permitidos.includes(nombre)) {
        return res.status(400).json({
          error: `El parámetro ${nombre} no está permitido.`,
        });
      }
    }

    for (const nombre of permitidos) {
      if (parametros.getAll(nombre).length > 1) {
        return res.status(400).json({
          error: `El parámetro ${nombre} no puede repetirse.`,
        });
      }
    }

    let sala;
    let orden = "estudiante";
    let pagina = 1;
    let limite = 2;

    if (parametros.has("sala")) {
      sala = parametros.get("sala").trim();

      if (sala === "") {
        return res.status(400).json({
          error: "El filtro sala no puede estar vacío.",
        });
      }
    }

    if (parametros.has("orden")) {
      orden = parametros.get("orden").trim();

      if (
        orden !== "estudiante" &&
        orden !== "personas-asc" &&
        orden !== "personas-desc"
      ) {
        return res.status(400).json({
          error: "El orden solicitado no es válido.",
        });
      }
    }

    if (parametros.has("pagina")) {
      const textoPagina = parametros.get("pagina");

      if (textoPagina.trim() === "") {
        return res.status(400).json({
          error: "La página no puede estar vacía.",
        });
      }

      pagina = Number(textoPagina);

      if (!Number.isInteger(pagina) || pagina < 1 || pagina > 1000) {
        return res.status(400).json({
          error: "La página debe ser un entero entre 1 y 1000.",
        });
      }
    }

    if (parametros.has("limite")) {
      const textoLimite = parametros.get("limite");

      if (textoLimite.trim() === "") {
        return res.status(400).json({
          error: "El límite no puede estar vacío.",
        });
      }

      limite = Number(textoLimite);

      if (!Number.isInteger(limite) || limite < 1 || limite > 20) {
        return res.status(400).json({
          error: "El límite debe ser un entero entre 1 y 20.",
        });
      }
    }

    const resultado = await servicio.consultar({
      sala,
      orden,
      pagina,
      limite,
    });

    return res.status(200).json(resultado);
  }

  async function detalle(req, res) {
    const id = req.params.id;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({
        error: "El identificador de la reserva no es válido.",
      });
    }

    const reserva = await servicio.buscarPorId(id);

    if (!reserva) {
      return res.status(404).json({
        error: "La reserva solicitada no existe.",
      });
    }

    return res.status(200).json(reserva);
  }

  async function crear(req, res) {
    const reserva = await servicio.crear(req.reservaValidada);

    res.location(`/api/reservas/${reserva.id}`);

    return res.status(201).json(reserva);
  }

  async function reemplazar(req, res) {
    const id = req.params.id;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({
        error: "El identificador de la reserva no es válido.",
      });
    }

    const reserva = await servicio.reemplazar(id, req.reservaValidada);

    if (!reserva) {
      return res.status(404).json({
        error: "La reserva solicitada no existe.",
      });
    }

    return res.status(200).json(reserva);
  }

  async function modificarParcialmente(req, res) {
    const id = req.params.id;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({
        error: "El identificador de la reserva no es válido.",
      });
    }

    const reserva = await servicio.modificarParcialmente(
      id,
      req.reservaValidada
    );

    if (!reserva) {
      return res.status(404).json({
        error: "La reserva solicitada no existe.",
      });
    }

    return res.status(200).json(reserva);
  }

  async function eliminar(req, res) {
    const id = req.params.id;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({
        error: "El identificador de la reserva no es válido.",
      });
    }

    const eliminada = await servicio.eliminar(id);

    if (!eliminada) {
      return res.status(404).json({
        error: "La reserva solicitada no existe.",
      });
    }

    return res.status(204).send();
  }

  return {
    listar,
    detalle,
    crear,
    reemplazar,
    modificarParcialmente,
    eliminar,
  };
}

module.exports = crearControladorReservasApi;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const data = JSON.parse(event.body);
    const { nombre, apellido, cargo, empresa, email, telefono, mensaje } = data;

    // Validación básica
    if (!nombre || !apellido || !empresa || !email || !mensaje) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Campos requeridos faltantes' }) };
    }

    // Validar variables de entorno
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.error('Variables de entorno faltantes:', {
        serviceId: serviceId ? '✓' : '✗',
        templateId: templateId ? '✓' : '✗',
        publicKey: publicKey ? '✓' : '✗'
      });
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Error de configuración del servidor' }) 
      };
    }

    // Enviar email vía EmailJS
    const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          nombre,
          apellido,
          cargo: cargo || 'No especificado',
          empresa,
          email,
          telefono: telefono || 'No proporcionado',
          mensaje
        }
      })
    });

    const responseText = await emailResponse.text();
    let emailData;
    
    try {
      emailData = JSON.parse(responseText);
    } catch (e) {
      console.error('Respuesta no-JSON de EmailJS:', responseText);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Error en respuesta de EmailJS' }) 
      };
    }

    if (!emailResponse.ok) {
      console.error('EmailJS error:', emailData);
      return { statusCode: 500, body: JSON.stringify({ error: 'Error enviando email' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Email enviado correctamente' })
    };

  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

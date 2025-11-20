# Firebase Studio

This is a NextJS starter in Firebase Studio.

Necesito crear una aplicación web para un Asistente Legal Virtual basado en un modelo RAG (Retrieval-Augmented Generation). La arquitectura de alto nivel debe incluir:

Frontend: Desarrollado con React/Next.js.

Base de Datos y Autenticación: Supabase (usando pgvector para el almacén vectorial, y el sistema de Auth de Supabase para la gestión de usuarios).

Modelo de Lenguaje (LLM): La API de Google Gemini (externa).

Diseña un Wireframe (esqueleto de la interfaz) y una Estructura de Carpeta/Código en Next.js, mostrando claramente la división entre los módulos:

Módulo 1: Administrativo

Submódulo 1A: Gestión de Usuarios

Una página o vista donde un administrador puede crear nuevos usuarios (incluyendo login/email, contraseña inicial, y un campo para establecer una fecha de caducidad del acceso).

Funcionalidad para gestionar usuarios existentes (editar nombre, deshabilitar, y forzar cambios de contraseña).

Submódulo 1B: Gestión de Contenido (Ingesta de Conocimiento)

Una página o vista para subir o pegar el texto de la ley chilena relevante.

Debe mostrar dónde se iniciaría la lógica de backend para: segmentar el texto (chunking), generar el embedding a través de la API de Gemini, y almacenar el texto y el vector en Supabase/pgvector.

Módulo 2: Cliente (Consulta con Login Requerido)

Una página de Login/Acceso que use el sistema de Auth de Supabase.

Una interfaz de chat simple donde el usuario ingresa su pregunta (solo accesible post-login).

Debe mostrar claramente dónde se iniciaría la lógica de backend para: vectorizar la pregunta, buscar en Supabase los fragmentos de ley más relevantes, y enviar el prompt con esos fragmentos de contexto a la API de Gemini para la respuesta final.

Por favor, enfócate en la arquitectura de Next.js y la interacción con Supabase (Auth y pgvector) y la API de Gemini, y pensando además en un estilo visual atractivo y moderno.
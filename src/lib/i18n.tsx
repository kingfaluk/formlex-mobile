/* App wording in the five FormLex languages. The choice is saved on the device; on first launch
   the phone's language is used when FormLex supports it. Arabic switches the layout to right-to-left
   (takes effect after the app restarts, as React Native requires). */
import { getLocales } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';

export type Lang = 'en' | 'es' | 'pt' | 'fr' | 'ar';
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' }, { code: 'es', label: 'Español' }, { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' }, { code: 'ar', label: 'العربية' },
];

const en = {
  'app.tagline': 'Legal documents drafted and reviewed for your country.',
  'common.retry': 'Try again', 'common.cancel': 'Cancel', 'common.save': 'Save', 'common.close': 'Close', 'common.back': 'Back', 'common.next': 'Next',
  'common.loading': 'Loading…', 'common.error': 'Something went wrong. Please try again.', 'common.offline': 'No connection. Check your internet and try again.',
  'tabs.documents': 'Documents', 'tabs.new': 'New', 'tabs.payments': 'Payments', 'tabs.help': 'Help', 'tabs.account': 'Account',
  'signin.title': 'Sign in to FormLex', 'signin.whatsapp': 'WhatsApp', 'signin.email': 'Email',
  'signin.phone': 'Your WhatsApp number', 'signin.phoneHint': 'We will send a six-digit sign-in code to your WhatsApp.',
  'signin.sendCode': 'Send code on WhatsApp', 'signin.sending': 'Sending code…', 'signin.codeSent': 'Enter the six-digit code sent to {phone}.',
  'signin.code': 'Verification code', 'signin.verify': 'Verify & continue', 'signin.verifying': 'Verifying…', 'signin.resend': 'Resend code', 'signin.resendIn': 'Resend in {n}s',
  'signin.changeNumber': 'Change number', 'signin.unavailable': 'WhatsApp sign-in is temporarily unavailable. Please use email and password.',
  'signin.emailLabel': 'Email address', 'signin.password': 'Password', 'signin.submit': 'Sign in', 'signin.create': 'Create an account', 'signin.haveAccount': 'I already have an account',
  'signin.name': 'Full name', 'signin.confirm': 'Confirm password', 'signin.createSubmit': 'Create account', 'signin.forgot': 'Forgot password? Reset it on the website.',
  'signin.agree': 'By continuing, you agree to our', 'signin.terms': 'Terms of Service', 'signin.privacy': 'Privacy Policy',
  'docs.title': 'My documents', 'docs.inProgress': 'In progress', 'docs.ready': 'Your documents', 'docs.empty': 'No documents yet', 'docs.emptyText': 'Start a document and it will appear here.',
  'docs.start': 'Start a document', 'docs.waitingPayment': 'Waiting for payment', 'docs.paid': 'Paid', 'docs.pay': 'Pay {price}', 'docs.submit': 'Submit for drafting', 'docs.submitting': 'Submitting…',
  'docs.inReview': 'In review', 'docs.approved': 'Ready', 'docs.changes': 'Changes requested', 'docs.version': 'Version {n}', 'docs.started': 'Started {date}',
  'doc.downloadPdf': 'Download PDF', 'doc.downloadWord': 'Download Word', 'doc.preparing': 'Preparing…', 'doc.revision': 'Request changes', 'doc.revisionHint': 'Describe what should change (at least 10 characters).',
  'doc.revisionSend': 'Send request', 'doc.revisionSent': 'Revision requested. The document is locked while changes are reviewed.', 'doc.locked': 'This document is waiting for review. You can open it once it is released.',
  'new.title': 'New document', 'new.choose': 'Choose a document', 'new.search': 'Search documents', 'new.custom': 'Can’t find your document? Describe what you need',
  'new.customTitle': 'Custom document', 'new.details': 'Document details', 'new.name': 'Document name', 'new.namePh': 'For example: Service agreement for my business',
  'new.country': 'Country whose law governs this document', 'new.region': 'State, province or territory', 'new.language': 'Document language',
  'new.questions': 'Questions {a} of {b}', 'new.review': 'Review your answers', 'new.notProvided': 'Not provided', 'new.required': 'Please answer the required questions.',
  'new.confirm': 'I confirm these facts. I understand AI providers process them to prepare a draft, which our team reviews before release.',
  'new.price': 'Price: {price}', 'new.payNote': 'Pay first. Once your payment is confirmed, your document is submitted for drafting and review automatically.',
  'new.paySubmit': 'Pay & submit', 'new.opening': 'Opening payment…', 'new.waiting': 'Confirming your payment…', 'new.waitingText': 'This usually takes a few seconds after you pay.',
  'new.checkAgain': 'I have paid — check again', 'new.notConfirmed': 'Payment is not confirmed yet. You can pay or submit later from My documents.',
  'new.submitted': 'Paid and submitted. Our team will review the draft; you will be notified when it is ready.', 'new.choosePrompt': 'Choose',
  'pay.title': 'Payments & invoices', 'pay.completed': 'Completed payments', 'pay.total': 'Total paid', 'pay.invoice': 'Invoice', 'pay.empty': 'No payments yet',
  'pay.emptyText': 'Payments appear here once you pay for a document.', 'pay.awaiting': 'Awaiting confirmation',
  'status.pending': 'Pending', 'status.completed': 'Paid', 'status.failed': 'Failed', 'status.verification_failed': 'Needs checking', 'status.reversed': 'Reversed',
  'help.title': 'Help & support', 'help.new': 'New ticket', 'help.empty': 'No tickets yet', 'help.emptyText': 'Ask us anything about your account, a payment or a document.',
  'help.subject': 'Subject', 'help.category': 'Topic', 'help.message': 'Message', 'help.messageHint': 'At least 10 characters.', 'help.send': 'Send', 'help.reply': 'Write a reply', 'help.support': 'FormLex support', 'help.you': 'You',
  'help.cat.account': 'Account', 'help.cat.billing': 'Payment', 'help.cat.document': 'Document', 'help.cat.technical': 'Technical problem', 'help.cat.other': 'Other',
  'help.open': 'Open', 'help.answered': 'Answered', 'help.resolved': 'Resolved', 'help.closed': 'Closed', 'help.close': 'Close ticket',
  'account.title': 'Account', 'account.profile': 'Profile', 'account.name': 'Full name', 'account.email': 'Email address', 'account.phone': 'Phone number', 'account.org': 'Organisation (optional)',
  'account.saved': 'Profile saved.', 'account.language': 'Language', 'account.rtl': 'Restart the app to switch the layout direction.', 'account.legal': 'Legal',
  'account.signOut': 'Sign out', 'account.needsEmail': 'Add your email address so we can send you your documents and invoices.', 'account.website': 'Open the website',
};
type Key = keyof typeof en;
type Dict = Record<Key, string>;

const es: Dict = {
  'app.tagline': 'Documentos legales redactados y revisados para tu país.',
  'common.retry': 'Reintentar', 'common.cancel': 'Cancelar', 'common.save': 'Guardar', 'common.close': 'Cerrar', 'common.back': 'Atrás', 'common.next': 'Siguiente',
  'common.loading': 'Cargando…', 'common.error': 'Algo salió mal. Inténtalo de nuevo.', 'common.offline': 'Sin conexión. Revisa tu internet e inténtalo de nuevo.',
  'tabs.documents': 'Documentos', 'tabs.new': 'Nuevo', 'tabs.payments': 'Pagos', 'tabs.help': 'Ayuda', 'tabs.account': 'Cuenta',
  'signin.title': 'Inicia sesión en FormLex', 'signin.whatsapp': 'WhatsApp', 'signin.email': 'Correo',
  'signin.phone': 'Tu número de WhatsApp', 'signin.phoneHint': 'Te enviaremos un código de acceso de seis dígitos por WhatsApp.',
  'signin.sendCode': 'Enviar código por WhatsApp', 'signin.sending': 'Enviando código…', 'signin.codeSent': 'Introduce el código de seis dígitos enviado a {phone}.',
  'signin.code': 'Código de verificación', 'signin.verify': 'Verificar y continuar', 'signin.verifying': 'Verificando…', 'signin.resend': 'Reenviar código', 'signin.resendIn': 'Reenviar en {n} s',
  'signin.changeNumber': 'Cambiar número', 'signin.unavailable': 'El inicio de sesión con WhatsApp no está disponible por ahora. Usa tu correo y contraseña.',
  'signin.emailLabel': 'Correo electrónico', 'signin.password': 'Contraseña', 'signin.submit': 'Iniciar sesión', 'signin.create': 'Crear una cuenta', 'signin.haveAccount': 'Ya tengo una cuenta',
  'signin.name': 'Nombre completo', 'signin.confirm': 'Confirmar contraseña', 'signin.createSubmit': 'Crear cuenta', 'signin.forgot': '¿Olvidaste tu contraseña? Restablécela en el sitio web.',
  'signin.agree': 'Al continuar, aceptas nuestros', 'signin.terms': 'Términos del servicio', 'signin.privacy': 'Política de privacidad',
  'docs.title': 'Mis documentos', 'docs.inProgress': 'En curso', 'docs.ready': 'Tus documentos', 'docs.empty': 'Todavía no hay documentos', 'docs.emptyText': 'Empieza un documento y aparecerá aquí.',
  'docs.start': 'Empezar un documento', 'docs.waitingPayment': 'Pendiente de pago', 'docs.paid': 'Pagado', 'docs.pay': 'Pagar {price}', 'docs.submit': 'Enviar a redacción', 'docs.submitting': 'Enviando…',
  'docs.inReview': 'En revisión', 'docs.approved': 'Listo', 'docs.changes': 'Cambios solicitados', 'docs.version': 'Versión {n}', 'docs.started': 'Iniciado el {date}',
  'doc.downloadPdf': 'Descargar PDF', 'doc.downloadWord': 'Descargar Word', 'doc.preparing': 'Preparando…', 'doc.revision': 'Solicitar cambios', 'doc.revisionHint': 'Describe qué debe cambiar (al menos 10 caracteres).',
  'doc.revisionSend': 'Enviar solicitud', 'doc.revisionSent': 'Revisión solicitada. El documento queda bloqueado mientras se revisan los cambios.', 'doc.locked': 'Este documento está pendiente de revisión. Podrás abrirlo cuando se entregue.',
  'new.title': 'Nuevo documento', 'new.choose': 'Elige un documento', 'new.search': 'Buscar documentos', 'new.custom': '¿No encuentras tu documento? Describe lo que necesitas',
  'new.customTitle': 'Documento personalizado', 'new.details': 'Datos del documento', 'new.name': 'Nombre del documento', 'new.namePh': 'Por ejemplo: contrato de servicios para mi empresa',
  'new.country': 'País cuya ley rige este documento', 'new.region': 'Estado, provincia o territorio', 'new.language': 'Idioma del documento',
  'new.questions': 'Preguntas {a} de {b}', 'new.review': 'Revisa tus respuestas', 'new.notProvided': 'Sin respuesta', 'new.required': 'Responde las preguntas obligatorias.',
  'new.confirm': 'Confirmo estos datos. Entiendo que proveedores de IA los procesan para preparar un borrador, que nuestro equipo revisa antes de entregarlo.',
  'new.price': 'Precio: {price}', 'new.payNote': 'Primero pagas. Cuando se confirme el pago, tu documento se envía automáticamente a redacción y revisión.',
  'new.paySubmit': 'Pagar y enviar', 'new.opening': 'Abriendo el pago…', 'new.waiting': 'Confirmando tu pago…', 'new.waitingText': 'Suele tardar unos segundos después de pagar.',
  'new.checkAgain': 'Ya pagué: comprobar de nuevo', 'new.notConfirmed': 'El pago aún no está confirmado. Puedes pagar o enviar más tarde desde Mis documentos.',
  'new.submitted': 'Pagado y enviado. Nuestro equipo revisará el borrador; te avisaremos cuando esté listo.', 'new.choosePrompt': 'Elegir',
  'pay.title': 'Pagos y facturas', 'pay.completed': 'Pagos completados', 'pay.total': 'Total pagado', 'pay.invoice': 'Factura', 'pay.empty': 'Todavía no hay pagos',
  'pay.emptyText': 'Los pagos aparecen aquí cuando pagas un documento.', 'pay.awaiting': 'Pendiente de confirmación',
  'status.pending': 'Pendiente', 'status.completed': 'Pagado', 'status.failed': 'Fallido', 'status.verification_failed': 'Por comprobar', 'status.reversed': 'Revertido',
  'help.title': 'Ayuda y soporte', 'help.new': 'Nueva incidencia', 'help.empty': 'Todavía no hay incidencias', 'help.emptyText': 'Pregúntanos lo que quieras sobre tu cuenta, un pago o un documento.',
  'help.subject': 'Asunto', 'help.category': 'Tema', 'help.message': 'Mensaje', 'help.messageHint': 'Al menos 10 caracteres.', 'help.send': 'Enviar', 'help.reply': 'Escribe una respuesta', 'help.support': 'Soporte de FormLex', 'help.you': 'Tú',
  'help.cat.account': 'Cuenta', 'help.cat.billing': 'Pago', 'help.cat.document': 'Documento', 'help.cat.technical': 'Problema técnico', 'help.cat.other': 'Otro',
  'help.open': 'Abierta', 'help.answered': 'Respondida', 'help.resolved': 'Resuelta', 'help.closed': 'Cerrada', 'help.close': 'Cerrar incidencia',
  'account.title': 'Cuenta', 'account.profile': 'Perfil', 'account.name': 'Nombre completo', 'account.email': 'Correo electrónico', 'account.phone': 'Teléfono', 'account.org': 'Organización (opcional)',
  'account.saved': 'Perfil guardado.', 'account.language': 'Idioma', 'account.rtl': 'Reinicia la app para cambiar la dirección del diseño.', 'account.legal': 'Legal',
  'account.signOut': 'Cerrar sesión', 'account.needsEmail': 'Añade tu correo para que podamos enviarte tus documentos y facturas.', 'account.website': 'Abrir el sitio web',
};

const pt: Dict = {
  'app.tagline': 'Documentos jurídicos redigidos e revisados para o seu país.',
  'common.retry': 'Tentar novamente', 'common.cancel': 'Cancelar', 'common.save': 'Salvar', 'common.close': 'Fechar', 'common.back': 'Voltar', 'common.next': 'Avançar',
  'common.loading': 'Carregando…', 'common.error': 'Algo deu errado. Tente novamente.', 'common.offline': 'Sem conexão. Verifique sua internet e tente novamente.',
  'tabs.documents': 'Documentos', 'tabs.new': 'Novo', 'tabs.payments': 'Pagamentos', 'tabs.help': 'Ajuda', 'tabs.account': 'Conta',
  'signin.title': 'Entre na FormLex', 'signin.whatsapp': 'WhatsApp', 'signin.email': 'E-mail',
  'signin.phone': 'Seu número de WhatsApp', 'signin.phoneHint': 'Enviaremos um código de acesso de seis dígitos para o seu WhatsApp.',
  'signin.sendCode': 'Enviar código pelo WhatsApp', 'signin.sending': 'Enviando código…', 'signin.codeSent': 'Digite o código de seis dígitos enviado para {phone}.',
  'signin.code': 'Código de verificação', 'signin.verify': 'Verificar e continuar', 'signin.verifying': 'Verificando…', 'signin.resend': 'Reenviar código', 'signin.resendIn': 'Reenviar em {n} s',
  'signin.changeNumber': 'Alterar número', 'signin.unavailable': 'O login com WhatsApp está indisponível no momento. Use e-mail e senha.',
  'signin.emailLabel': 'E-mail', 'signin.password': 'Senha', 'signin.submit': 'Entrar', 'signin.create': 'Criar uma conta', 'signin.haveAccount': 'Já tenho uma conta',
  'signin.name': 'Nome completo', 'signin.confirm': 'Confirmar senha', 'signin.createSubmit': 'Criar conta', 'signin.forgot': 'Esqueceu a senha? Redefina no site.',
  'signin.agree': 'Ao continuar, você concorda com nossos', 'signin.terms': 'Termos de Serviço', 'signin.privacy': 'Política de Privacidade',
  'docs.title': 'Meus documentos', 'docs.inProgress': 'Em andamento', 'docs.ready': 'Seus documentos', 'docs.empty': 'Ainda não há documentos', 'docs.emptyText': 'Comece um documento e ele aparecerá aqui.',
  'docs.start': 'Começar um documento', 'docs.waitingPayment': 'Aguardando pagamento', 'docs.paid': 'Pago', 'docs.pay': 'Pagar {price}', 'docs.submit': 'Enviar para redação', 'docs.submitting': 'Enviando…',
  'docs.inReview': 'Em revisão', 'docs.approved': 'Pronto', 'docs.changes': 'Alterações solicitadas', 'docs.version': 'Versão {n}', 'docs.started': 'Iniciado em {date}',
  'doc.downloadPdf': 'Baixar PDF', 'doc.downloadWord': 'Baixar Word', 'doc.preparing': 'Preparando…', 'doc.revision': 'Solicitar alterações', 'doc.revisionHint': 'Descreva o que deve mudar (pelo menos 10 caracteres).',
  'doc.revisionSend': 'Enviar solicitação', 'doc.revisionSent': 'Revisão solicitada. O documento fica bloqueado enquanto as alterações são revisadas.', 'doc.locked': 'Este documento aguarda revisão. Você poderá abri-lo quando for liberado.',
  'new.title': 'Novo documento', 'new.choose': 'Escolha um documento', 'new.search': 'Pesquisar documentos', 'new.custom': 'Não encontrou seu documento? Descreva o que você precisa',
  'new.customTitle': 'Documento personalizado', 'new.details': 'Dados do documento', 'new.name': 'Nome do documento', 'new.namePh': 'Por exemplo: contrato de serviços para minha empresa',
  'new.country': 'País cuja lei rege este documento', 'new.region': 'Estado, província ou território', 'new.language': 'Idioma do documento',
  'new.questions': 'Perguntas {a} de {b}', 'new.review': 'Revise suas respostas', 'new.notProvided': 'Não informado', 'new.required': 'Responda às perguntas obrigatórias.',
  'new.confirm': 'Confirmo estes fatos. Entendo que provedores de IA os processam para preparar uma minuta, que nossa equipe revisa antes da liberação.',
  'new.price': 'Preço: {price}', 'new.payNote': 'Primeiro você paga. Assim que o pagamento for confirmado, seu documento é enviado automaticamente para redação e revisão.',
  'new.paySubmit': 'Pagar e enviar', 'new.opening': 'Abrindo o pagamento…', 'new.waiting': 'Confirmando seu pagamento…', 'new.waitingText': 'Costuma levar alguns segundos após o pagamento.',
  'new.checkAgain': 'Já paguei — verificar de novo', 'new.notConfirmed': 'O pagamento ainda não foi confirmado. Você pode pagar ou enviar depois em Meus documentos.',
  'new.submitted': 'Pago e enviado. Nossa equipe revisará a minuta; você será avisado quando estiver pronta.', 'new.choosePrompt': 'Escolher',
  'pay.title': 'Pagamentos e faturas', 'pay.completed': 'Pagamentos concluídos', 'pay.total': 'Total pago', 'pay.invoice': 'Fatura', 'pay.empty': 'Ainda não há pagamentos',
  'pay.emptyText': 'Os pagamentos aparecem aqui quando você paga por um documento.', 'pay.awaiting': 'Aguardando confirmação',
  'status.pending': 'Pendente', 'status.completed': 'Pago', 'status.failed': 'Falhou', 'status.verification_failed': 'Em verificação', 'status.reversed': 'Estornado',
  'help.title': 'Ajuda e suporte', 'help.new': 'Novo chamado', 'help.empty': 'Ainda não há chamados', 'help.emptyText': 'Pergunte o que quiser sobre sua conta, um pagamento ou um documento.',
  'help.subject': 'Assunto', 'help.category': 'Tema', 'help.message': 'Mensagem', 'help.messageHint': 'Pelo menos 10 caracteres.', 'help.send': 'Enviar', 'help.reply': 'Escreva uma resposta', 'help.support': 'Suporte FormLex', 'help.you': 'Você',
  'help.cat.account': 'Conta', 'help.cat.billing': 'Pagamento', 'help.cat.document': 'Documento', 'help.cat.technical': 'Problema técnico', 'help.cat.other': 'Outro',
  'help.open': 'Aberto', 'help.answered': 'Respondido', 'help.resolved': 'Resolvido', 'help.closed': 'Fechado', 'help.close': 'Fechar chamado',
  'account.title': 'Conta', 'account.profile': 'Perfil', 'account.name': 'Nome completo', 'account.email': 'E-mail', 'account.phone': 'Telefone', 'account.org': 'Organização (opcional)',
  'account.saved': 'Perfil salvo.', 'account.language': 'Idioma', 'account.rtl': 'Reinicie o app para mudar a direção do layout.', 'account.legal': 'Jurídico',
  'account.signOut': 'Sair', 'account.needsEmail': 'Adicione seu e-mail para que possamos enviar seus documentos e faturas.', 'account.website': 'Abrir o site',
};

const fr: Dict = {
  'app.tagline': 'Des documents juridiques rédigés et vérifiés pour votre pays.',
  'common.retry': 'Réessayer', 'common.cancel': 'Annuler', 'common.save': 'Enregistrer', 'common.close': 'Fermer', 'common.back': 'Retour', 'common.next': 'Suivant',
  'common.loading': 'Chargement…', 'common.error': 'Une erreur est survenue. Veuillez réessayer.', 'common.offline': 'Pas de connexion. Vérifiez votre internet et réessayez.',
  'tabs.documents': 'Documents', 'tabs.new': 'Nouveau', 'tabs.payments': 'Paiements', 'tabs.help': 'Aide', 'tabs.account': 'Compte',
  'signin.title': 'Connexion à FormLex', 'signin.whatsapp': 'WhatsApp', 'signin.email': 'E-mail',
  'signin.phone': 'Votre numéro WhatsApp', 'signin.phoneHint': 'Nous vous enverrons un code de connexion à six chiffres sur WhatsApp.',
  'signin.sendCode': 'Envoyer le code sur WhatsApp', 'signin.sending': 'Envoi du code…', 'signin.codeSent': 'Saisissez le code à six chiffres envoyé au {phone}.',
  'signin.code': 'Code de vérification', 'signin.verify': 'Vérifier et continuer', 'signin.verifying': 'Vérification…', 'signin.resend': 'Renvoyer le code', 'signin.resendIn': 'Renvoyer dans {n} s',
  'signin.changeNumber': 'Changer de numéro', 'signin.unavailable': 'La connexion par WhatsApp est momentanément indisponible. Utilisez votre e-mail et votre mot de passe.',
  'signin.emailLabel': 'Adresse e-mail', 'signin.password': 'Mot de passe', 'signin.submit': 'Se connecter', 'signin.create': 'Créer un compte', 'signin.haveAccount': 'J’ai déjà un compte',
  'signin.name': 'Nom complet', 'signin.confirm': 'Confirmer le mot de passe', 'signin.createSubmit': 'Créer le compte', 'signin.forgot': 'Mot de passe oublié ? Réinitialisez-le sur le site.',
  'signin.agree': 'En continuant, vous acceptez nos', 'signin.terms': 'Conditions d’utilisation', 'signin.privacy': 'Politique de confidentialité',
  'docs.title': 'Mes documents', 'docs.inProgress': 'En cours', 'docs.ready': 'Vos documents', 'docs.empty': 'Aucun document pour l’instant', 'docs.emptyText': 'Commencez un document et il apparaîtra ici.',
  'docs.start': 'Commencer un document', 'docs.waitingPayment': 'En attente de paiement', 'docs.paid': 'Payé', 'docs.pay': 'Payer {price}', 'docs.submit': 'Envoyer en rédaction', 'docs.submitting': 'Envoi…',
  'docs.inReview': 'En vérification', 'docs.approved': 'Prêt', 'docs.changes': 'Modifications demandées', 'docs.version': 'Version {n}', 'docs.started': 'Commencé le {date}',
  'doc.downloadPdf': 'Télécharger le PDF', 'doc.downloadWord': 'Télécharger le Word', 'doc.preparing': 'Préparation…', 'doc.revision': 'Demander des modifications', 'doc.revisionHint': 'Décrivez ce qui doit changer (au moins 10 caractères).',
  'doc.revisionSend': 'Envoyer la demande', 'doc.revisionSent': 'Révision demandée. Le document est verrouillé pendant l’examen des modifications.', 'doc.locked': 'Ce document attend sa vérification. Vous pourrez l’ouvrir une fois remis.',
  'new.title': 'Nouveau document', 'new.choose': 'Choisissez un document', 'new.search': 'Rechercher des documents', 'new.custom': 'Vous ne trouvez pas votre document ? Décrivez votre besoin',
  'new.customTitle': 'Document personnalisé', 'new.details': 'Informations du document', 'new.name': 'Nom du document', 'new.namePh': 'Par exemple : contrat de prestation pour mon entreprise',
  'new.country': 'Pays dont le droit régit ce document', 'new.region': 'État, province ou territoire', 'new.language': 'Langue du document',
  'new.questions': 'Questions {a} sur {b}', 'new.review': 'Vérifiez vos réponses', 'new.notProvided': 'Non renseigné', 'new.required': 'Veuillez répondre aux questions obligatoires.',
  'new.confirm': 'Je confirme ces faits. Je comprends que des fournisseurs d’IA les traitent pour préparer un projet, que notre équipe vérifie avant remise.',
  'new.price': 'Prix : {price}', 'new.payNote': 'Vous payez d’abord. Dès la confirmation du paiement, votre document est envoyé automatiquement en rédaction et en vérification.',
  'new.paySubmit': 'Payer et envoyer', 'new.opening': 'Ouverture du paiement…', 'new.waiting': 'Confirmation de votre paiement…', 'new.waitingText': 'Cela prend généralement quelques secondes après le paiement.',
  'new.checkAgain': 'J’ai payé — vérifier à nouveau', 'new.notConfirmed': 'Le paiement n’est pas encore confirmé. Vous pourrez payer ou envoyer plus tard depuis Mes documents.',
  'new.submitted': 'Payé et envoyé. Notre équipe va vérifier le projet ; vous serez prévenu lorsqu’il sera prêt.', 'new.choosePrompt': 'Choisir',
  'pay.title': 'Paiements et factures', 'pay.completed': 'Paiements effectués', 'pay.total': 'Total payé', 'pay.invoice': 'Facture', 'pay.empty': 'Aucun paiement pour l’instant',
  'pay.emptyText': 'Les paiements apparaissent ici dès que vous payez un document.', 'pay.awaiting': 'En attente de confirmation',
  'status.pending': 'En attente', 'status.completed': 'Payé', 'status.failed': 'Échec', 'status.verification_failed': 'À vérifier', 'status.reversed': 'Annulé',
  'help.title': 'Aide et assistance', 'help.new': 'Nouveau ticket', 'help.empty': 'Aucun ticket pour l’instant', 'help.emptyText': 'Posez-nous vos questions sur votre compte, un paiement ou un document.',
  'help.subject': 'Objet', 'help.category': 'Sujet', 'help.message': 'Message', 'help.messageHint': 'Au moins 10 caractères.', 'help.send': 'Envoyer', 'help.reply': 'Écrire une réponse', 'help.support': 'Assistance FormLex', 'help.you': 'Vous',
  'help.cat.account': 'Compte', 'help.cat.billing': 'Paiement', 'help.cat.document': 'Document', 'help.cat.technical': 'Problème technique', 'help.cat.other': 'Autre',
  'help.open': 'Ouvert', 'help.answered': 'Répondu', 'help.resolved': 'Résolu', 'help.closed': 'Fermé', 'help.close': 'Fermer le ticket',
  'account.title': 'Compte', 'account.profile': 'Profil', 'account.name': 'Nom complet', 'account.email': 'Adresse e-mail', 'account.phone': 'Téléphone', 'account.org': 'Organisation (facultatif)',
  'account.saved': 'Profil enregistré.', 'account.language': 'Langue', 'account.rtl': 'Redémarrez l’application pour changer le sens de lecture.', 'account.legal': 'Mentions légales',
  'account.signOut': 'Se déconnecter', 'account.needsEmail': 'Ajoutez votre e-mail pour recevoir vos documents et factures.', 'account.website': 'Ouvrir le site',
};

const ar: Dict = {
  'app.tagline': 'مستندات قانونية مُعدّة ومُراجَعة لبلدك.',
  'common.retry': 'إعادة المحاولة', 'common.cancel': 'إلغاء', 'common.save': 'حفظ', 'common.close': 'إغلاق', 'common.back': 'رجوع', 'common.next': 'التالي',
  'common.loading': 'جارٍ التحميل…', 'common.error': 'حدث خطأ ما. يُرجى المحاولة مرة أخرى.', 'common.offline': 'لا يوجد اتصال. تحقق من الإنترنت وحاول مجددًا.',
  'tabs.documents': 'المستندات', 'tabs.new': 'جديد', 'tabs.payments': 'المدفوعات', 'tabs.help': 'المساعدة', 'tabs.account': 'الحساب',
  'signin.title': 'تسجيل الدخول إلى FormLex', 'signin.whatsapp': 'واتساب', 'signin.email': 'البريد',
  'signin.phone': 'رقم واتساب الخاص بك', 'signin.phoneHint': 'سنرسل رمز دخول من ستة أرقام إلى واتساب الخاص بك.',
  'signin.sendCode': 'أرسل الرمز عبر واتساب', 'signin.sending': 'جارٍ إرسال الرمز…', 'signin.codeSent': 'أدخل الرمز المكوّن من ستة أرقام المرسل إلى {phone}.',
  'signin.code': 'رمز التحقق', 'signin.verify': 'تحقق وتابع', 'signin.verifying': 'جارٍ التحقق…', 'signin.resend': 'إعادة إرسال الرمز', 'signin.resendIn': 'إعادة الإرسال بعد {n} ث',
  'signin.changeNumber': 'تغيير الرقم', 'signin.unavailable': 'تسجيل الدخول عبر واتساب غير متاح مؤقتًا. يُرجى استخدام البريد الإلكتروني وكلمة المرور.',
  'signin.emailLabel': 'البريد الإلكتروني', 'signin.password': 'كلمة المرور', 'signin.submit': 'تسجيل الدخول', 'signin.create': 'إنشاء حساب', 'signin.haveAccount': 'لدي حساب بالفعل',
  'signin.name': 'الاسم الكامل', 'signin.confirm': 'تأكيد كلمة المرور', 'signin.createSubmit': 'إنشاء الحساب', 'signin.forgot': 'نسيت كلمة المرور؟ أعد تعيينها من الموقع.',
  'signin.agree': 'بالمتابعة، فإنك توافق على', 'signin.terms': 'شروط الخدمة', 'signin.privacy': 'سياسة الخصوصية',
  'docs.title': 'مستنداتي', 'docs.inProgress': 'قيد التنفيذ', 'docs.ready': 'مستنداتك', 'docs.empty': 'لا توجد مستندات بعد', 'docs.emptyText': 'ابدأ مستندًا وسيظهر هنا.',
  'docs.start': 'ابدأ مستندًا', 'docs.waitingPayment': 'بانتظار الدفع', 'docs.paid': 'مدفوع', 'docs.pay': 'ادفع {price}', 'docs.submit': 'إرسال للإعداد', 'docs.submitting': 'جارٍ الإرسال…',
  'docs.inReview': 'قيد المراجعة', 'docs.approved': 'جاهز', 'docs.changes': 'طُلبت تعديلات', 'docs.version': 'الإصدار {n}', 'docs.started': 'بدأ في {date}',
  'doc.downloadPdf': 'تنزيل PDF', 'doc.downloadWord': 'تنزيل Word', 'doc.preparing': 'جارٍ التجهيز…', 'doc.revision': 'طلب تعديلات', 'doc.revisionHint': 'صِف ما يجب تغييره (10 أحرف على الأقل).',
  'doc.revisionSend': 'إرسال الطلب', 'doc.revisionSent': 'تم طلب التعديل. يُقفل المستند أثناء مراجعة التعديلات.', 'doc.locked': 'هذا المستند بانتظار المراجعة. يمكنك فتحه بعد تسليمه.',
  'new.title': 'مستند جديد', 'new.choose': 'اختر مستندًا', 'new.search': 'ابحث في المستندات', 'new.custom': 'لم تجد مستندك؟ صِف ما تحتاجه',
  'new.customTitle': 'مستند مخصص', 'new.details': 'بيانات المستند', 'new.name': 'اسم المستند', 'new.namePh': 'مثال: عقد خدمات لنشاطي التجاري',
  'new.country': 'البلد الذي يحكم قانونه هذا المستند', 'new.region': 'الولاية أو المقاطعة أو الإقليم', 'new.language': 'لغة المستند',
  'new.questions': 'الأسئلة {a} من {b}', 'new.review': 'راجع إجاباتك', 'new.notProvided': 'لم تُقدَّم', 'new.required': 'يُرجى الإجابة عن الأسئلة المطلوبة.',
  'new.confirm': 'أؤكد هذه الوقائع، وأفهم أن مزوّدي الذكاء الاصطناعي يعالجونها لإعداد مسودة يراجعها فريقنا قبل التسليم.',
  'new.price': 'السعر: {price}', 'new.payNote': 'ادفع أولًا. بمجرد تأكيد الدفع، يُرسَل مستندك تلقائيًا للإعداد والمراجعة.',
  'new.paySubmit': 'ادفع وأرسل', 'new.opening': 'جارٍ فتح صفحة الدفع…', 'new.waiting': 'جارٍ تأكيد الدفع…', 'new.waitingText': 'يستغرق ذلك عادةً بضع ثوانٍ بعد الدفع.',
  'new.checkAgain': 'لقد دفعت — تحقق مجددًا', 'new.notConfirmed': 'لم يتم تأكيد الدفع بعد. يمكنك الدفع أو الإرسال لاحقًا من «مستنداتي».',
  'new.submitted': 'تم الدفع والإرسال. سيراجع فريقنا المسودة وسنُعلمك عندما تصبح جاهزة.', 'new.choosePrompt': 'اختر',
  'pay.title': 'المدفوعات والفواتير', 'pay.completed': 'المدفوعات المكتملة', 'pay.total': 'إجمالي المدفوع', 'pay.invoice': 'الفاتورة', 'pay.empty': 'لا توجد مدفوعات بعد',
  'pay.emptyText': 'تظهر المدفوعات هنا بمجرد أن تدفع مقابل مستند.', 'pay.awaiting': 'بانتظار التأكيد',
  'status.pending': 'معلّق', 'status.completed': 'مدفوع', 'status.failed': 'فشل', 'status.verification_failed': 'يحتاج إلى تحقق', 'status.reversed': 'مسترد',
  'help.title': 'المساعدة والدعم', 'help.new': 'تذكرة جديدة', 'help.empty': 'لا توجد تذاكر بعد', 'help.emptyText': 'اسألنا عن أي شيء يخص حسابك أو دفعة أو مستندًا.',
  'help.subject': 'الموضوع', 'help.category': 'المجال', 'help.message': 'الرسالة', 'help.messageHint': '10 أحرف على الأقل.', 'help.send': 'إرسال', 'help.reply': 'اكتب ردًا', 'help.support': 'دعم FormLex', 'help.you': 'أنت',
  'help.cat.account': 'الحساب', 'help.cat.billing': 'الدفع', 'help.cat.document': 'مستند', 'help.cat.technical': 'مشكلة تقنية', 'help.cat.other': 'أخرى',
  'help.open': 'مفتوحة', 'help.answered': 'تم الرد', 'help.resolved': 'تم الحل', 'help.closed': 'مغلقة', 'help.close': 'إغلاق التذكرة',
  'account.title': 'الحساب', 'account.profile': 'الملف الشخصي', 'account.name': 'الاسم الكامل', 'account.email': 'البريد الإلكتروني', 'account.phone': 'رقم الهاتف', 'account.org': 'المؤسسة (اختياري)',
  'account.saved': 'تم حفظ الملف الشخصي.', 'account.language': 'اللغة', 'account.rtl': 'أعد تشغيل التطبيق لتغيير اتجاه التخطيط.', 'account.legal': 'قانوني',
  'account.signOut': 'تسجيل الخروج', 'account.needsEmail': 'أضف بريدك الإلكتروني لنرسل إليك مستنداتك وفواتيرك.', 'account.website': 'فتح الموقع',
};

const DICTS: Record<Lang, Dict> = { en, es, pt, fr, ar };
const STORE_KEY = 'formlex_lang';

function deviceLang(): Lang {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return (LANGS.some(l => l.code === code) ? code : 'en') as Lang;
}

type I18n = { lang: Lang; setLang: (l: Lang) => Promise<boolean>; t: (key: Key, vars?: Record<string, string | number>) => string };
const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(deviceLang);
  useEffect(() => {
    SecureStore.getItemAsync(STORE_KEY).then(saved => { if (saved && saved in DICTS) setLangState(saved as Lang); }).catch(() => {});
  }, []);
  /** Returns true when the layout direction changed and the app must restart to apply it. */
  const setLang = useCallback(async (l: Lang) => {
    setLangState(l);
    await SecureStore.setItemAsync(STORE_KEY, l).catch(() => {});
    const rtl = l === 'ar';
    if (I18nManager.isRTL !== rtl) { I18nManager.allowRTL(rtl); I18nManager.forceRTL(rtl); return true; }
    return false;
  }, []);
  const t = useCallback((key: Key, vars?: Record<string, string | number>) => {
    let s = DICTS[lang][key] ?? en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  }, [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n must be used inside I18nProvider');
  return v;
}

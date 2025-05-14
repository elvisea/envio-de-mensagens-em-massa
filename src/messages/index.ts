// Message templates
export const messageTemplate = `Olá, Dr(a)! 👋

Sou Elvis da BytefulCode. Desenvolvemos soluções digitais específicas para psicólogos.

Ajudamos profissionais como você a:

✨ Atrair mais pacientes com site/landing page profissional
📱 Gerenciar agenda e consultas automaticamente
📋 Controlar prontuários com total segurança (LGPD)
💳 Automatizar cobranças e recibos

Já auxiliamos diversos profissionais da área a otimizarem seu tempo e aumentarem seus resultados.

Podemos conversar sobre como digitalizar seu consultório?

Para conhecer melhor nosso trabalho e ver exemplos de projetos, acesse nossa página:`;

export const lawyerTemplate = `Olá, Dr(a)! 👋

Sou Elvis da BytefulCode. Desenvolvemos soluções digitais específicas para advogados e escritórios de advocacia.

Ajudamos profissionais como você a:

⚖️ Criar sites e landing pages profissionais para captação de clientes
📱 Gerenciar processos e prazos de forma automatizada
📋 Controlar documentos e petições com segurança (LGPD)
💼 Automatizar tarefas administrativas do escritório
⏰ Organizar agenda de audiências e compromissos
💳 Gerenciar cobranças e honorários

Já auxiliamos diversos escritórios a otimizarem seus processos e aumentarem sua carteira de clientes.

Podemos conversar sobre como digitalizar seu escritório?

Para conhecer melhor nosso trabalho e ver exemplos de projetos, acesse nossa página:`;

export const genericTemplate = `Olá! 👋

Sou Elvis da BytefulCode. Somos especialistas em transformação digital para empresas e profissionais.

Desenvolvemos soluções que ajudam negócios a:

🌟 Aumentar visibilidade online com sites e landing pages profissionais
📱 Automatizar processos e gestão do dia a dia
💼 Otimizar tarefas administrativas e burocráticas
📊 Controlar finanças, vendas e resultados
🔒 Gerenciar dados e documentos com segurança (LGPD)
⚡ Reduzir custos operacionais

Nossos clientes relatam:
✅ Mais tempo livre para focar no core business
✅ Aumento significativo na captação de clientes
✅ Redução de custos com processos manuais
✅ Melhor organização e controle do negócio

Que tal uma conversa rápida sobre como podemos ajudar a digitalizar e impulsionar seu negócio?

Para conhecer melhor nosso trabalho e ver casos de sucesso, acesse nossa página:`;

export const linkMessage = `https://bytefulcode.tech`;

export const tonMessage = `Oportunidade imperdível pra você que quer vender no débito e crédito sem pagar mensalidade!

Olá! 👋 Vi que você criou sua empresa recentemente e que tem interesse na maquininha Ton. Quero te mostrar por que agora é o melhor momento pra garantir a sua:

✅ Taxas a partir de 0,74% – uma das menores do mercado
✅ Zero mensalidade – você compra e a máquina é sua!
✅ Receba em até 1 dia útil
✅ Suporte rápido e confiável
✅ Desconto exclusivo por tempo limitado

🔗 Garanta agora sua maquininha com meu link especial:
link oficial da TON: https://bit.ly/3Ygot8q

⚠️ Promoção válida por tempo limitado. Me chama aqui e aproveita antes que acabe! 💬`

export const newTonMessage = `Olá, tudo bem? 👋 Me chamo Ana Luiza e sou consultora oficial da Ton. Estou entrando em contato porque vi que sua empresa foi criada recentemente e acredito que podemos ajudar você a vender com mais facilidade e economia.

Gostaria de compartilhar uma oportunidade especial:

✅ Taxas a partir de 0,74% – uma das menores do mercado
✅ Zero mensalidade – a máquina é sua!
✅ Receba em até 1 dia útil
✅ Suporte rápido e confiável
✅ Desconto exclusivo por tempo limitado

Todas as informações completas estão disponíveis no site oficial da Ton: https://bit.ly/3Ygot8q.

Se preferir, também estou à disposição para te ajudar no que precisar! 💬

⚠️ Promoção válida por tempo limitado. Qualquer dúvida é só me chamar!

Caso não queira receber mensagens, é só me avisar. 😉`

// Estrutura de mensagens separadas em mensagem principal e rodapé
export interface MensagemVariante {
  mensagem: string;
  rodape: string;
}

// Lista padrão de benefícios para usar em todas as mensagens - abordagem mais consultiva
const BENEFICIOS_PADRAO = `• Otimize suas vendas com taxas a partir de 0,74%
• Sem custos mensais recorrentes
• Pagamentos disponíveis em até 1 dia útil
• Assistência personalizada sempre que precisar`;

// Apresentação padrão mais consultiva
const APRESENTACAO_PADRAO = `Sou Ana Luiza, consultora oficial da Ton. Estou aqui para ajudar empreendedores como você:`;

// Rodapé padrão mais sutil, sem link direto e com referência ao catálogo
const RODAPE_PADRAO = `Temos um catálogo completo disponível em meu perfil para você consultar quando desejar.
Estou à disposição se precisar de ajuda! 💬
Se preferir não receber outras mensagens, é só avisar.`;

// Variantes de mensagem TON - abordagem mais consultiva
export const varianteMensagem0: MensagemVariante = {
  mensagem: `Vi que sua empresa está começando [NAME]! 
Parabéns por esse passo importante. O mercado está repleto de oportunidades para negócios inovadores.

${APRESENTACAO_PADRAO}

${BENEFICIOS_PADRAO}`,

  rodape: RODAPE_PADRAO
};

export const varianteMensagem1: MensagemVariante = {
  mensagem: `Notei que você iniciou um novo empreendimento [NAME].
É inspirador ver novos negócios surgindo mesmo em tempos desafiadores.

${APRESENTACAO_PADRAO}

${BENEFICIOS_PADRAO}`,

  rodape: RODAPE_PADRAO
};

export const varianteMensagem2: MensagemVariante = {
  mensagem: `Gostaria de parabenizar pelo seu novo negócio [NAME].
Empreendedores como você impulsionam a economia e trazem inovação ao mercado.

${APRESENTACAO_PADRAO}

${BENEFICIOS_PADRAO}`,

  rodape: RODAPE_PADRAO
};

export const varianteMensagem3: MensagemVariante = {
  mensagem: `Percebi que você começou uma nova jornada empresarial [NAME].
Os primeiros passos de um negócio são fundamentais para seu desenvolvimento futuro.

${APRESENTACAO_PADRAO}

${BENEFICIOS_PADRAO}`,

  rodape: RODAPE_PADRAO
};

export const varianteMensagem4: MensagemVariante = {
  mensagem: `Observei que você entrou para o mundo dos negócios recentemente [NAME].
Cada novo empreendimento traz possibilidades empolgantes e desafios únicos.

${APRESENTACAO_PADRAO}

${BENEFICIOS_PADRAO}`,

  rodape: RODAPE_PADRAO
};

export const varianteMensagem5: MensagemVariante = {
  mensagem: `Soube do seu novo empreendimento [NAME] e gostaria de conectar.
O momento inicial de um negócio é crucial para estabelecer bases sólidas.

${APRESENTACAO_PADRAO}

${BENEFICIOS_PADRAO}`,

  rodape: RODAPE_PADRAO
};

export const mensagemVariants = [
  varianteMensagem0,
  varianteMensagem1,
  varianteMensagem2,
  varianteMensagem3,
  varianteMensagem4,
  varianteMensagem5,
];

// Mantendo as variáveis antigas para compatibilidade (pode ser removido depois)
export const newMessageVariant0 = `${varianteMensagem0.mensagem}\n\n${varianteMensagem0.rodape}`;
export const newMessageVariant1 = `${varianteMensagem1.mensagem}\n\n${varianteMensagem1.rodape}`;
export const newMessageVariant2 = `${varianteMensagem2.mensagem}\n\n${varianteMensagem2.rodape}`;
export const newMessageVariant3 = `${varianteMensagem3.mensagem}\n\n${varianteMensagem3.rodape}`;
export const newMessageVariant4 = `${varianteMensagem4.mensagem}\n\n${varianteMensagem4.rodape}`;
export const newMessageVariant5 = `${varianteMensagem5.mensagem}\n\n${varianteMensagem5.rodape}`;

export const messageVariants = [
  newMessageVariant0,
  newMessageVariant1,
  newMessageVariant2,
  newMessageVariant3,
  newMessageVariant4,
  newMessageVariant5,
];
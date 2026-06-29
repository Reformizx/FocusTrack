Specification

Requisitos Funcionais (RF)

Os requisitos funcionais descrevem as funcionalidades que o sistema deve oferecer ao usuário.

RF01 – Cadastro de usuários

O sistema deve permitir que novos usuários criem uma conta utilizando e-mail e senha.

RF02 – Autenticação

O sistema deve permitir que usuários autenticados realizem login e logout de forma segura.

RF03 – Gerenciamento de metas

O sistema deve permitir que o usuário crie, edite, visualize e encerre metas de autocontrole.

RF04 – Registro de recaídas

O sistema deve permitir registrar uma recaída informando:

motivo da recaída;
observações (opcional).
RF05 – Histórico

O sistema deve apresentar o histórico completo das recaídas registradas pelo usuário.

RF06 – Cálculo do streak

O sistema deve calcular automaticamente o número de dias consecutivos sem recaídas.

RF07 – Dashboard

O sistema deve apresentar um painel contendo:

meta ativa;
streak atual;
total de recaídas;
gráficos de evolução;

RF08 – Feedback automático

O sistema deve apresentar mensagens motivacionais e informativas baseadas no progresso do usuário.

RF09 – Tema da aplicação

O sistema deve permitir alternar entre modo claro e modo escuro.


Requisitos Não Funcionais (RNF)

Os requisitos não funcionais especificam características de qualidade do sistema.

RNF01 – Desempenho

O tempo médio de carregamento das páginas não deve ultrapassar 3 segundos em conexões comuns de internet.

RNF02 – Segurança

Os usuários deverão ser autenticados utilizando o Firebase Authentication.

RNF03 – Armazenamento

Todos os dados deverão ser armazenados no Firebase Firestore.

RNF04 – Interface

A interface deverá ser intuitiva, responsiva e seguir princípios básicos de usabilidade.

RNF05 – Compatibilidade

O sistema deverá funcionar nas versões atuais dos principais navegadores:

Google Chrome
Microsoft Edge
Mozilla Firefox
RNF06 – Responsividade

O sistema deverá apresentar boa experiência de uso em dispositivos móveis e desktops.

RNF07 – Disponibilidade

O sistema deverá estar disponível pela internet através do serviço de hospedagem.

RNF08 – Escalabilidade

A arquitetura deverá permitir futuras funcionalidades sem necessidade de reestruturação completa.

RNF09 – Manutenibilidade

O código deverá ser organizado em componentes reutilizáveis utilizando React.

RNF10 – Persistência

Os dados do usuário deverão permanecer armazenados mesmo após logout ou fechamento da aplicação.

RNF11 – Acessibilidade

A interface deverá utilizar contraste adequado entre texto e fundo e possuir elementos de navegação claramente identificados.

Regras de Negócio (RN)

RN01

Uma recaída somente poderá ser registrada se existir uma meta ativa.

RN02

O streak deverá ser reiniciado sempre que uma recaída for registrada.

RN03

O dashboard deverá exibir apenas informações do usuário autenticado.

RN04

Somente o proprietário poderá visualizar e alterar seus próprios registros.


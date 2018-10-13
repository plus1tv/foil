import portfolio from './portfolio';


export default app => {

  app.post('/api/v1/portfolio', portfolio);
  
};
import { HttpClient } from '@dynatrace-sdk/http-client';
import { executeDql } from './execute-dql';

export const listProblems = async (dtClient: HttpClient, additionalFilter?: string) => {
  console.error(`Listing problems: additionalFilter=${JSON.stringify(additionalFilter)}`);

  const response = await dtClient.send({
    url: `api/v2/problems`,
    method: 'GET',
  });

  // return await response.body();
  return await response.body('json');
};

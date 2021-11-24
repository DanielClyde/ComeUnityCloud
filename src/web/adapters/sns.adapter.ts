import { CreatePlatformEndpointCommand, CreatePlatformEndpointCommandInput, CreatePlatformEndpointCommandOutput, DeleteEndpointCommand, DeleteEndpointCommandInput, PublishCommand, PublishCommandInput, SetEndpointAttributesCommand, SetEndpointAttributesCommandInput, SetEndpointAttributesCommandOutput, SNSClient } from "@aws-sdk/client-sns";

export class SNSAdapter {
  private _sns: SNSClient

  constructor() {
    this._sns = new SNSClient({ apiVersion: 'latest', region: process.env.AWS_REGION })
  }

  async sendNotification(endpointArn: string, message: string): Promise<{ success: boolean }> {
    const input: PublishCommandInput = {
      TargetArn: endpointArn,
      Message: message,
    };
    const command = new PublishCommand(input);
    try {
      const res = await this._sns.send(command);
      return res ? { success: true } : { success: false };
    } catch (e) {
      console.log(e);
      return { success: false };
    }
  }

  async createApplePlatformEndpoint(deviceToken: string, userId: string): Promise<{ success: boolean, endpointArn?: string }> {
    const input: CreatePlatformEndpointCommandInput = {
      CustomUserData: userId,
      PlatformApplicationArn: process.env.SNS_APPLE_APP_ENDPOINT,
      Token: deviceToken,
    };
    const command = new CreatePlatformEndpointCommand(input);
    try {
      const res: CreatePlatformEndpointCommandOutput = await this._sns.send(command);
      return res?.EndpointArn ? { success: true, endpointArn: res.EndpointArn } : { success: false };
    } catch (e) {
      console.log(e);
      return { success: false };
    }
  }

  async updatePlatformEndpointToken(endpoint: string, newToken: string): Promise<{ success: boolean }> {
    const input: SetEndpointAttributesCommandInput = {
      EndpointArn: endpoint,
      Attributes: {
        Token: newToken,
      },
    };
    const command = new SetEndpointAttributesCommand(input);
    try {
      const res: SetEndpointAttributesCommandOutput = await this._sns.send(command);
      return res ? { success: true } : { success: false };
    } catch (e) {
      return { success: false };
    }
  }

  async deletePlatformEndpoint(endpoint: string): Promise<{ success: boolean }> {
    console.log('deleting endpoint', endpoint);
    const input: DeleteEndpointCommandInput = {
      EndpointArn: endpoint
    };
    const command = new DeleteEndpointCommand(input);
    try {
      const res = await this._sns.send(command);
      return res ? { success: true } : { success: false };
    } catch (e) {
      return { success: false };
    }
  }


}

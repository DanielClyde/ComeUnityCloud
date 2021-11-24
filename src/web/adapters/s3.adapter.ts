import { S3Client, PutObjectCommandInput, PutObjectCommand } from '@aws-sdk/client-s3';

export class S3Adapter {
  private _s3: S3Client;

  constructor() {
    this._s3 = new S3Client({ apiVersion: 'latest', region: process.env.AWS_REGION });
  }

  async putImage(Bucket: string, Key: string, imgData: string) {
    const input: PutObjectCommandInput = {
      Bucket,
      Key,
      Body: new Buffer(imgData.replace(/^data:image\/\w+;base64,/, ''), 'base64'),
      ContentEncoding: 'base64',
      ContentType: 'image/jpeg',
    };
    const command = new PutObjectCommand(input);
    try {
      const res = await this._s3.send(command);
      return res ? { success: true } : { success: false };
    } catch (e) {
      console.log(e);
      return { success: false };
    }
  }
}

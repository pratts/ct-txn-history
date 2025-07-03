export class AlchemyBlockNumDto {
    data: {
        network: string;
        block: {
            number: number,
            timestamp: string
        }
    }[];
}
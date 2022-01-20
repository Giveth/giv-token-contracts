export type Batch = {
    nonce: string;
    recipients: string[];
    amounts: string[];
};

export const testBatches: Batch[] = [
    {
        nonce: "1",
        recipients: [
            "0xB52bA5E14510364e98d3fBc7920c332741D60244",
            "0x4278b2139D5d742258E6fDe53cb1c3a907EA066b",
            "0xE320545291F1a7FBd77Bd37344fCD810884a01Ca",
        ],
        amounts: ["1000", "2000", "3000"],
    },
    {
        nonce: "2",
        recipients: [
            "0xcd59ED69c07673F21EfAfFa5C0bE9E193Ea77761",
            "0xDC1680165ED9d0e91241Bb4DeB21378cc0ae48d4",
            "0xf4f8C634A4c006aB345bB953f52aE829cd504e62",
        ],
        amounts: ["1000", "2000", "3000"],
    },
    {
        nonce: "3",
        recipients: [
            "0x1faC580D8EFD3368a036779742f418961dAE9ebf",
            "0x1a2175940507B05cA28d359aB6E928841D423DEf",
            "0x25867F5af88797fAEb12c6273e56dce395b8A4B2",
        ],
        amounts: ["1000", "2000", "3000"],
    },
];

export declare type User = {
    name: string;
    language: string;
    id: string;
    bio: string;
    version: number;
    state?: string;
    createdDate?: string;
};

export declare type UserResponse = {
    data: User[];
    meta: {
        totalRowCount: number;
    };
};

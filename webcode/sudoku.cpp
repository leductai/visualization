#include <iostream>
using namespace std;

char sudoku[9][9];

bool coTheDien(int dong, int cot, char so) {
    for (int i = 0; i < 9; i++) {
        if (sudoku[dong][i] == so) return false;
        if (sudoku[i][cot] == so) return false;
    }

    int dongBatDau = dong / 3 * 3;
    int cotBatDau = cot / 3 * 3;

    for (int i = dongBatDau; i < dongBatDau + 3; i++) {
        for (int j = cotBatDau; j < cotBatDau + 3; j++) {
            if (sudoku[i][j] == so) return false;
        }
    }

    return true;
}

bool quayLui() {
    for (int dong = 0; dong < 9; dong++) {
        for (int cot = 0; cot < 9; cot++) {
            if (sudoku[dong][cot] == 'X') {
                for (char so = '1'; so <= '9'; so++) {
                    if (coTheDien(dong, cot, so)) {
                        sudoku[dong][cot] = so;

                        if (quayLui()) return true;

                        sudoku[dong][cot] = 'X';
                    }
                }

                return false;
            }
        }
    }

    return true;
}

int main() {
    for (int i = 0; i < 9; i++) {
        for (int j = 0; j < 9; j++) {
            cin >> sudoku[i][j];
        }
    }

    quayLui();

    for (int i = 0; i < 9; i++) {
        for (int j = 0; j < 9; j++) {
            cout << sudoku[i][j];
            if (j < 8) cout << ' ';
        }
        cout << '\n';
    }

    return 0;
}

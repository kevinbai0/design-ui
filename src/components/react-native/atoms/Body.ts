import styled from "styled-components/native";
import Body from "../../atoms/Body";
import { DNA } from "../../../theme/types";

export default styled.Text<DNA>`
    ${props => Body(props, "react-native")}
`;